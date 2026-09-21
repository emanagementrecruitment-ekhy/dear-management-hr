import { NextResponse } from "next/server";
import { requireSession, apiError } from "@/lib/api-auth";
import { getAnnouncement } from "@/lib/settings";

/** Read-only — any logged-in session can see the current running-text banner. */
export async function GET() {
  try {
    await requireSession();
    const announcement = await getAnnouncement();
    return NextResponse.json(announcement);
  } catch (e) {
    return apiError(e);
  }
}
