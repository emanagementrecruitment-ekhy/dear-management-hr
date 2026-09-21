import { NextResponse } from "next/server";

// Keeps the public-facing download link on DEAR Management's own domain —
// the actual installer is a GitHub Release asset (built by
// .github/workflows/build-windows-desktop.yml), which the login page and
// the public website should never link to directly.
const DESKTOP_INSTALLER_URL =
  "https://github.com/emanagementrecruitment-ekhy/dear-management-hr/releases/latest/download/DEAR-Management-Desktop-Setup.exe";

export function GET() {
  return NextResponse.redirect(DESKTOP_INSTALLER_URL);
}
