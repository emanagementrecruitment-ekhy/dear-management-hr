import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, apiError } from "@/lib/api-auth";
import { getAnnouncement, SETTING_ID } from "@/lib/settings";

const MANAGERS = ["OWNER", "CONSULTANT", "ADMIN_PUSAT", "MANAGER"] as const;

export async function GET() {
  try {
    await requireSession([...MANAGERS]);
    const announcement = await getAnnouncement();
    return NextResponse.json(announcement);
  } catch (e) {
    return apiError(e);
  }
}

/** Sets or clears the running-text banner karyawan/Tera see below the DEAR logo. */
export async function PUT(req: Request) {
  try {
    const session = await requireSession([...MANAGERS]);
    const body = await req.json().catch(() => null);
    const textRaw = typeof body?.text === "string" ? body.text.trim() : "";

    await prisma.appSetting.upsert({
      where: { id: SETTING_ID },
      update: {
        announcementText: textRaw || null,
        announcementUpdatedAt: new Date(),
        announcementUpdatedById: session.employeeId,
      },
      create: {
        id: SETTING_ID,
        announcementText: textRaw || null,
        announcementUpdatedAt: new Date(),
        announcementUpdatedById: session.employeeId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
