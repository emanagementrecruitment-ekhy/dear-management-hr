import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SETTING_ID = "singleton";

// One-time merge of confirmed duplicate Tera: each pair below is the same
// real person under two accounts — an older placeholder (@dear.id email,
// auto-created by the Rekap Pendapatan/VCR bulk importer when a monthly
// recap sheet named someone it couldn't match yet) and the real-contact
// account onboarded in prisma/import-tera-2026-09.ts. Confirmed by hand via
// prisma/dry-run-find-duplicates.ts output: matching outlet + name +
// (for DISA) an exact phone match. Every placeholder here has 0 attendance/
// payslipItem/kasbon rows (never actually logged in), so only its Voucher
// history needs to move to the real account before it's deleted — but every
// relation is reassigned defensively in case that ever changes.
// Guarded by AppSetting.teraDuplicateMergeAt so this only ever runs once.
const PAIRS: { placeholderCode: string; realEmail: string }[] = [
  { placeholderCode: "PR-001", realEmail: "evinadwiagustin04@gmail.com" }, // SILA
  { placeholderCode: "PR-002", realEmail: "ayuu1038@gmail.com" }, // KIKA
  { placeholderCode: "PR-003", realEmail: "koyahaje@gmail.com" }, // VIOLET
  { placeholderCode: "PR-004", realEmail: "deaa260608@gmail.com" }, // AUDREY (MTR)
  { placeholderCode: "PR-005", realEmail: "wdyaaaraa7@gmail.com" }, // AUDREY (SA)
  { placeholderCode: "PR-006", realEmail: "frasydha@gmail.com" }, // MELDA
  { placeholderCode: "PR-008", realEmail: "calmemegan32@gmail.com" }, // MEGAN
  { placeholderCode: "PR-009", realEmail: "dellaamelia6712@gmail.com" }, // YUMA
  { placeholderCode: "PR-010", realEmail: "puspitaneli448@gmail.com" }, // SANDRA
  { placeholderCode: "PR-011", realEmail: "gadissamudra179@gmail.com" }, // LINDA
  { placeholderCode: "PR-012", realEmail: "amiiyani555@gmail.com" }, // ANISA
  { placeholderCode: "PR-013", realEmail: "ur966338@gmail.com" }, // MOLI/MOLLY
  { placeholderCode: "PR-014", realEmail: "handayanitria138@gmail.com" }, // YASMIN
  { placeholderCode: "PR-015", realEmail: "fitriyaninovi447@gmail.com" }, // AZILA
  { placeholderCode: "PR-016", realEmail: "nairashakila098@gmail.com" }, // AIRA
  { placeholderCode: "PR-017", realEmail: "psumegeh@gmail.com" }, // REYNA
  { placeholderCode: "PR-018", realEmail: "saridwiyulia19@gmail.com" }, // DEA
  { placeholderCode: "PR-019", realEmail: "mellyalmaidah90@gmail.com" }, // AMEL (MTR)
  { placeholderCode: "PR-020", realEmail: "neng123.com@icloud.com" }, // NAYLA
  { placeholderCode: "PR-021", realEmail: "mamey37@gmail.com" }, // NANA
  { placeholderCode: "PR-025", realEmail: "sabilachyntia0@gmail.com" }, // SHINTA
  { placeholderCode: "PR-026", realEmail: "audyaadawiyahs@gmail.com" }, // YUKI
  { placeholderCode: "PR-027", realEmail: "arimahjunia@gmail.com" }, // VANEA
  { placeholderCode: "PR-030", realEmail: "diyahayusetia816@gmail.com" }, // NAYA
  { placeholderCode: "PR-032", realEmail: "adetialestari60@gmail.com" }, // MIRA
  { placeholderCode: "PR-033", realEmail: "msalisa72@gmail.com" }, // YENI
  { placeholderCode: "PR-035", realEmail: "kasmawatikas94@gmail.com" }, // TIARA (MTR)
  { placeholderCode: "PR-037", realEmail: "delad2622@gmail.com" }, // LILY
  { placeholderCode: "PR-039", realEmail: "angelikagustianingrum@gmail.com" }, // LITA
  { placeholderCode: "PR-040", realEmail: "cristaliananda32@gmail.com" }, // DENADA
  { placeholderCode: "PR-041", realEmail: "saniasaputri0808@gmail.com" }, // SENA
  { placeholderCode: "PR-044", realEmail: "astutiwindy680@gmail.com" }, // MELA/MELLA (SA)
  { placeholderCode: "PR-045", realEmail: "yanadestyana1@gmail.com" }, // KINA
  { placeholderCode: "PR-046", realEmail: "depiyana1708@gmail.com" }, // LIDYA
  { placeholderCode: "PR-047", realEmail: "iisisnawati1811@gmail.com" }, // DISA
];

async function main() {
  const setting = await prisma.appSetting.findUnique({ where: { id: SETTING_ID } });
  if ((setting as { teraDuplicateMergeAt?: Date } | null)?.teraDuplicateMergeAt) {
    console.log(`[merge-dup] already ran — skipping.`);
    return;
  }

  let merged = 0;
  let vouchersMoved = 0;

  for (const pair of PAIRS) {
    const placeholder = await prisma.employee.findUnique({ where: { code: pair.placeholderCode } });
    const real = await prisma.employee.findUnique({ where: { email: pair.realEmail } });

    if (!placeholder) {
      console.log(`[merge-dup] placeholder ${pair.placeholderCode} not found — skipped.`);
      continue;
    }
    if (!real) {
      console.log(`[merge-dup] real employee ${pair.realEmail} not found — skipped.`);
      continue;
    }
    if (!placeholder.email.endsWith("@dear.id")) {
      console.log(`[merge-dup] ${pair.placeholderCode} is not a placeholder anymore (email=${placeholder.email}) — skipped for safety.`);
      continue;
    }

    try {
      const v = await prisma.voucher.updateMany({ where: { employeeId: placeholder.id }, data: { employeeId: real.id } });
      await prisma.attendance.deleteMany({ where: { employeeId: placeholder.id } }); // count was 0; clears defensively, unique-per-day so no safe merge
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

      merged++;
      vouchersMoved += v.count;
      console.log(
        `[merge-dup] merged "${placeholder.name}" (${placeholder.code}) into "${real.name}" (${real.code}) — moved ${v.count} voucher(s).`
      );
    } catch (e) {
      console.error(`[merge-dup] FAILED merging ${pair.placeholderCode} into ${pair.realEmail}:`, e);
    }
  }

  await prisma.appSetting.upsert({
    where: { id: SETTING_ID },
    update: { teraDuplicateMergeAt: new Date() },
    create: { id: SETTING_ID, teraDuplicateMergeAt: new Date() },
  });

  console.log(`[merge-dup] done — merged ${merged}/${PAIRS.length} pair(s), moved ${vouchersMoved} voucher(s) total.`);
}

main()
  .catch((e) => {
    console.error("[merge-dup] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
