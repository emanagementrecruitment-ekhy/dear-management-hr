import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Follow-up to merge-duplicate-tera.ts: that script's PR-047 pair looked up
// the real DISA account by the email from the original WhatsApp list
// (iisisnawati1811@gmail.com), but her actual stored record (AR-60, created
// before the Sept 2026 batch ran — see the "phone already used" skip line
// in that batch's own log) has a slightly different stored email. Matching
// by employee code instead this time, which is unambiguous.
async function main() {
  const placeholder = await prisma.employee.findUnique({ where: { code: "PR-047" } });
  const real = await prisma.employee.findUnique({ where: { code: "AR-60" } });

  if (!placeholder) {
    console.log("[merge-disa-fixup] PR-047 not found — already merged or never existed, nothing to do.");
    return;
  }
  if (!real) {
    console.log("[merge-disa-fixup] AR-60 not found — cannot merge, skipping.");
    return;
  }
  if (!placeholder.email.endsWith("@dear.id")) {
    console.log(`[merge-disa-fixup] PR-047 is not a placeholder anymore (email=${placeholder.email}) — skipped for safety.`);
    return;
  }

  const v = await prisma.voucher.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
  await prisma.attendance.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.payslipItem.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
  await prisma.kasbon.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
  await prisma.kasbon.updateMany({ where: { decidedById: placeholder.id }, data: { decidedById: real.id } });
  await prisma.chatMessage.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
  await prisma.chatMessage.updateMany({ where: { senderId: placeholder.id }, data: { senderId: real.id } });
  await prisma.savingEntry.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
  await prisma.recurringCost.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
  await prisma.loginEvent.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.otpCode.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.pushSubscription.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.reminderRecipient.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.attendancePenaltyCheck.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.resignPayslip.deleteMany({ where: { employeeId: placeholder.id } });
  await prisma.employee.updateMany({ where: { supervisorId: placeholder.id }, data: { supervisorId: null } });

  await prisma.employee.delete({ where: { id: placeholder.id } });

  console.log(`[merge-disa-fixup] merged "${placeholder.name}" (${placeholder.code}) into "${real.name}" (${real.code}) — moved ${v.count} voucher(s).`);
}

main()
  .catch((e) => {
    console.error("[merge-disa-fixup] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
