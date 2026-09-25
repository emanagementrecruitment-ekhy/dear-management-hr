import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { VCR_ROLE } from "../src/lib/constants";

const prisma = new PrismaClient();

// Read-only investigation, take 2 — the first pass (matching by exact bare
// name) found nothing, because the "@dear.id" placeholder-email records
// left behind by the Rekap Pendapatan/VCR bulk importer
// (src/app/api/admin/vouchers/import/route.ts — see uniqueEmail() there)
// aren't necessarily named exactly as a plain first name. This instead:
// 1. Lists every @dear.id placeholder-email employee (definitely created
//    by that importer, never a real onboarded login) grouped by outlet.
// 2. Lists every one of the 52 Sept 2026 onboarded Tera (real email) at
//    the same outlet, so the two lists can be eyeballed side by side for
//    the same real person under two different name spellings.
async function main() {
  const placeholders = await prisma.employee.findMany({
    where: { email: { endsWith: "@dear.id" } },
    include: { _count: { select: { vouchers: true, attendances: true, payslipItems: true, kasbonRequests: true } } },
    orderBy: [{ homePlace: "asc" }, { name: "asc" }],
  });

  console.log(`[dup-scan] ${placeholders.length} placeholder (@dear.id) employee(s) — likely from Rekap Pendapatan auto-create:`);
  for (const p of placeholders) {
    console.log(
      `[dup-scan] PLACEHOLDER "${p.name}" (${p.code}, ${p.role}) @ ${p.homePlace} — email=${p.email} phone=${p.phone} ` +
        `vouchers=${p._count.vouchers} attendances=${p._count.attendances} payslipItems=${p._count.payslipItems} kasbon=${p._count.kasbonRequests}`
    );
  }

  const myBatch = await prisma.employee.findMany({
    where: { code: { startsWith: "AR-" }, role: VCR_ROLE, NOT: { email: { endsWith: "@dear.id" } } },
    orderBy: [{ homePlace: "asc" }, { name: "asc" }],
  });
  console.log(`[dup-scan] ${myBatch.length} real-contact Tera (AR- code, non-placeholder email):`);
  for (const m of myBatch) {
    console.log(`[dup-scan] REAL "${m.name}" (${m.code}) @ ${m.homePlace} — email=${m.email} phone=${m.phone}`);
  }

  const totalEmployees = await prisma.employee.count();
  const totalTera = await prisma.employee.count({ where: { role: VCR_ROLE } });
  console.log(`[dup-scan] totals: ${totalEmployees} employees overall, ${totalTera} with role Tera.`);
}

main()
  .catch((e) => {
    console.error("[dup-scan] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
