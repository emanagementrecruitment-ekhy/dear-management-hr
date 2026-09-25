import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, apiError } from "@/lib/api-auth";
import { EMPLOYEE_LEVELS, FIELD_CITIES, type EmployeeLevel } from "@/lib/constants";
import { fmtRp, dayKey } from "@/lib/format";
import { notifyOffice } from "@/lib/notify";

const MANAGERS = ["OWNER", "CONSULTANT", "ADMIN_PUSAT", "MANAGER"] as const;

// The list on Input Pendapatan groups raw Voucher rows one line per
// employee per day (see GET in ../route.ts) — its synthetic id is
// `${employeeId}_${dayKey}`, not a real row id, since a single day's entry
// is usually several identical Voucher rows from one Tambah Entri/import
// submit. Editing or deleting here always acts on the whole day's group.
function parseKey(key: string) {
  const idx = key.indexOf("_");
  if (idx < 0) return null;
  return { employeeId: key.slice(0, idx), day: key.slice(idx + 1) };
}

async function loadGroup(employeeId: string, day: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) return null;
  const vouchers = await prisma.voucher.findMany({ where: { employeeId } });
  const rows = vouchers.filter((v) => dayKey(v.occurredAt) === day);
  return { employee, rows };
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    await requireSession([...MANAGERS]);
    const parsed = parseKey(decodeURIComponent((await params).key));
    if (!parsed) return NextResponse.json({ error: "Entri tidak ditemukan." }, { status: 404 });

    const group = await loadGroup(parsed.employeeId, parsed.day);
    if (!group || group.rows.length === 0) return NextResponse.json({ error: "Entri tidak ditemukan." }, { status: 404 });

    const first = group.rows[0];
    const mixed = group.rows.some((v) => v.category !== first.category || v.amount !== first.amount || v.client !== first.client);

    return NextResponse.json({
      employeeId: group.employee.id,
      employeeName: group.employee.name,
      employeeCode: group.employee.code,
      category: first.category,
      client: first.client,
      amount: first.amount,
      qty: group.rows.length,
      occurredAt: parsed.day,
      mixed,
      total: group.rows.reduce((s, v) => s + v.amount, 0),
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    await requireSession([...MANAGERS]);
    const parsed = parseKey(decodeURIComponent((await params).key));
    if (!parsed) return NextResponse.json({ error: "Entri tidak ditemukan." }, { status: 404 });

    const group = await loadGroup(parsed.employeeId, parsed.day);
    if (!group || group.rows.length === 0) return NextResponse.json({ error: "Entri tidak ditemukan." }, { status: 404 });

    const body = await req.json().catch(() => null);
    const category = body?.category as EmployeeLevel;
    const client = typeof body?.client === "string" ? body.client.trim() : "";
    const amount = Number(body?.amount);
    const qty = Number.isFinite(Number(body?.qty)) ? Math.round(Number(body?.qty)) : NaN;
    const occurredAtRaw = typeof body?.occurredAt === "string" ? body.occurredAt : "";

    if (!EMPLOYEE_LEVELS.includes(category)) return NextResponse.json({ error: "Level tidak valid." }, { status: 400 });
    if (!client || !FIELD_CITIES.some((c) => c.place === client)) {
      return NextResponse.json({ error: "Lokasi kerja tidak valid." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });
    if (!Number.isInteger(qty) || qty <= 0) return NextResponse.json({ error: "Jumlah VCR tidak valid." }, { status: 400 });
    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date(parsed.day);
    if (Number.isNaN(occurredAt.getTime())) return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });

    // Replace-in-place: this route only ever acts on one day's group for one
    // employee, so deleting exactly those rows and reinserting the edited
    // count/rate is simpler and safer than trying to diff old vs new rows —
    // same idempotent "delete then recreate" pattern already used by the
    // Rekap Pendapatan bulk importer for a resubmitted month.
    await prisma.voucher.deleteMany({ where: { id: { in: group.rows.map((v) => v.id) } } });
    await prisma.voucher.createMany({
      data: Array.from({ length: qty }, () => ({ employeeId: parsed.employeeId, category, client, amount, occurredAt })),
    });

    await notifyOffice(`Pendapatan diedit untuk ${group.employee.name}: ${qty} voucher · ${fmtRp(amount * qty)}`);

    return NextResponse.json({ ok: true, newKey: `${parsed.employeeId}_${dayKey(occurredAt)}` });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    await requireSession([...MANAGERS]);
    const parsed = parseKey(decodeURIComponent((await params).key));
    if (!parsed) return NextResponse.json({ error: "Entri tidak ditemukan." }, { status: 404 });

    const group = await loadGroup(parsed.employeeId, parsed.day);
    if (!group || group.rows.length === 0) return NextResponse.json({ error: "Entri tidak ditemukan." }, { status: 404 });

    await prisma.voucher.deleteMany({ where: { id: { in: group.rows.map((v) => v.id) } } });
    await notifyOffice(`Pendapatan dihapus untuk ${group.employee.name} (${group.rows.length} voucher, ${parsed.day}).`);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
