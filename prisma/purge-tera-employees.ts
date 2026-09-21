import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { VCR_ROLE, DEMO_TERA_CODE } from "../src/lib/constants";

const prisma = new PrismaClient();
const SETTING_ID = "singleton";

// One-time, admin-requested cleanup: remove every real "Tera" employee from
// the live roster, keeping only the standing demo Tera (DEMO_TERA_CODE,
// "Grace" — see ensure-demo-tera.ts) and every non-Tera ("Karyawan") employee
// untouched. Guarded by AppSetting.teraPurgeAt so it only ever runs once,
// the same pattern as cleanup-demo-employees.ts — otherwise it would delete
// any new Tera an admin adds on every subsequent deploy.
//
// A hard delete (not a RESIGN flag) per the admin's explicit request — every
// Voucher/Attendance/PayslipItem/Kasbon/etc. row for these employees is
// cascade-deleted with them (see onDelete: Cascade in schema.prisma) and is
// not recoverable afterward.
async function main() {
  const setting = await prisma.appSetting.findUnique({ where: { id: SETTING_ID } });
  if (setting?.teraPurgeAt) {
    console.log(`[purge-tera-employees] already ran at ${setting.teraPurgeAt.toISOString()} — skipping.`);
    return;
  }

  const toDelete = await prisma.employee.findMany({
    where: { role: VCR_ROLE, code: { not: DEMO_TERA_CODE } },
    select: { id: true, name: true, code: true },
  });
  const ids = toDelete.map((e) => e.id);

  if (ids.length > 0) {
    // Clear self-referential/cross-employee FKs pointing at a Tera about to
    // be deleted so the bulk delete below never trips a constraint.
    await prisma.employee.updateMany({ where: { supervisorId: { in: ids } }, data: { supervisorId: null } });
    await prisma.kasbon.updateMany({ where: { decidedById: { in: ids } }, data: { decidedById: null } });
    await prisma.employee.deleteMany({ where: { id: { in: ids } } });
  }

  await prisma.appSetting.upsert({
    where: { id: SETTING_ID },
    update: { teraPurgeAt: new Date() },
    create: { id: SETTING_ID, teraPurgeAt: new Date() },
  });

  console.log(
    `[purge-tera-employees] removed ${ids.length} Tera employee(s): ${toDelete.map((e) => `${e.name} (${e.code})`).join(", ") || "none"}. Marked done — will not run again.`
  );
}

main()
  .catch((e) => {
    console.error("[purge-tera-employees] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
