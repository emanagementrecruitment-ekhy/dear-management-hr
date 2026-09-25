import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Read-only investigation script — no writes. For each of the 52 Tera
// onboarded in prisma/import-tera-2026-09.ts, derive the "bare" first name
// (the name before I appended the outlet for disambiguation) and look for
// an older employee record at the same outlet under that bare name — likely
// created earlier by the Rekap Pendapatan/VCR bulk importer
// (src/app/api/admin/vouchers/import/route.ts), which auto-creates an
// employee with a placeholder @dear.id email/phone when a recap sheet names
// someone it can't match by name+outlet.
const BATCH: { bareName: string; outlet: string; realEmail: string }[] = [
  { bareName: "SILA", outlet: "MTR", realEmail: "evinadwiagustin04@gmail.com" },
  { bareName: "KIKA", outlet: "MTR", realEmail: "ayuu1038@gmail.com" },
  { bareName: "LARAS", outlet: "MTR", realEmail: "adnankhairullah2021@gmail.com" },
  { bareName: "IREN", outlet: "MA", realEmail: "virnasalsabila4@gmail.com" },
  { bareName: "VIOLET", outlet: "SA", realEmail: "koyahaje@gmail.com" },
  { bareName: "AUDREY", outlet: "MTR", realEmail: "deaa260608@gmail.com" },
  { bareName: "AUDREY", outlet: "SA", realEmail: "wdyaaaraa7@gmail.com" },
  { bareName: "MELDA", outlet: "MTR", realEmail: "frasydha@gmail.com" },
  { bareName: "AMEL", outlet: "MA", realEmail: "dwisusanti9633@gmail.com" },
  { bareName: "MEGAN", outlet: "MA", realEmail: "calmemegan32@gmail.com" },
  { bareName: "YUMA", outlet: "MA", realEmail: "dellaamelia6712@gmail.com" },
  { bareName: "SANDRA", outlet: "MTR", realEmail: "puspitaneli448@gmail.com" },
  { bareName: "MELLA", outlet: "MTR", realEmail: "nounauna30@gmail.com" },
  { bareName: "LINDA", outlet: "MTR", realEmail: "gadissamudra179@gmail.com" },
  { bareName: "ANISA", outlet: "SA", realEmail: "amiiyani555@gmail.com" },
  { bareName: "MOLI", outlet: "MA", realEmail: "ur966338@gmail.com" },
  { bareName: "YASMIN", outlet: "MA", realEmail: "handayanitria138@gmail.com" },
  { bareName: "AZILA", outlet: "MEDIKA", realEmail: "fitriyaninovi447@gmail.com" },
  { bareName: "AIRA", outlet: "MTR", realEmail: "nairashakila098@gmail.com" },
  { bareName: "REYNA", outlet: "MEDIKA", realEmail: "psumegeh@gmail.com" },
  { bareName: "DEA", outlet: "MTR", realEmail: "saridwiyulia19@gmail.com" },
  { bareName: "AMEL", outlet: "MTR", realEmail: "mellyalmaidah90@gmail.com" },
  { bareName: "NAYLA", outlet: "MA", realEmail: "neng123.com@icloud.com" },
  { bareName: "NANA", outlet: "MA", realEmail: "mamey37@gmail.com" },
  { bareName: "MELA", outlet: "HRV", realEmail: "syena19nana@gmail.com" },
  { bareName: "MISKA", outlet: "LA", realEmail: "rikasabela6@gmail.com" },
  { bareName: "TIARA", outlet: "LA", realEmail: "luluuu014@gmail.com" },
  { bareName: "SHINTA", outlet: "MEDIKA", realEmail: "sabilachyntia0@gmail.com" },
  { bareName: "YUKI", outlet: "MA", realEmail: "audyaadawiyahs@gmail.com" },
  { bareName: "VANEA", outlet: "MA", realEmail: "arimahjunia@gmail.com" },
  { bareName: "LALA", outlet: "MA", realEmail: "rimaandina85@gmail.com" },
  { bareName: "ARSYA", outlet: "HRV", realEmail: "salsabilamahira10@icloud.com" },
  { bareName: "NAYA", outlet: "MTR", realEmail: "diyahayusetia816@gmail.com" },
  { bareName: "ELLA", outlet: "MA", realEmail: "sundusiahundus@gmail.com" },
  { bareName: "MIRA", outlet: "MTR", realEmail: "adetialestari60@gmail.com" },
  { bareName: "YENI", outlet: "MA", realEmail: "msalisa72@gmail.com" },
  { bareName: "LISA", outlet: "MA", realEmail: "putripertiwirysfiah@gmail.com" },
  { bareName: "JASMINE", outlet: "LA", realEmail: "ayut6776@gmail.com" },
  { bareName: "TIARAA", outlet: "MTR", realEmail: "kasmawatikas94@gmail.com" },
  { bareName: "CLAUDYA", outlet: "LA", realEmail: "taniasintiabellatan@gmail.com" },
  { bareName: "LILY", outlet: "MEDIKA", realEmail: "delad2622@gmail.com" },
  { bareName: "ALEA", outlet: "MA", realEmail: "syaasyaady@gmail.com" },
  { bareName: "LITA", outlet: "SA", realEmail: "angelikagustianingrum@gmail.com" },
  { bareName: "DENADA", outlet: "MTR", realEmail: "cristaliananda32@gmail.com" },
  { bareName: "SENA", outlet: "MA", realEmail: "saniasaputri0808@gmail.com" },
  { bareName: "BEBY", outlet: "MA", realEmail: "meiyhaastia@gmail.com" },
  { bareName: "ARA", outlet: "MA", realEmail: "rikakusniawati61@gmail.com" },
  { bareName: "MELA", outlet: "SA", realEmail: "astutiwindy680@gmail.com" },
  { bareName: "KINA", outlet: "MEDIKA", realEmail: "yanadestyana1@gmail.com" },
  { bareName: "LIDYA", outlet: "MTR", realEmail: "depiyana1708@gmail.com" },
  { bareName: "DISA", outlet: "MTR", realEmail: "iisisnawati1811@gmail.com" },
  { bareName: "CLARISA", outlet: "LA", realEmail: "levinatarida@gmail.com" },
];

async function main() {
  console.log(`[dry-run] checking ${BATCH.length} onboarded Tera for older duplicate records...`);
  let found = 0;

  for (const b of BATCH) {
    const mine = await prisma.employee.findUnique({ where: { email: b.realEmail } });
    if (!mine) {
      console.log(`[dry-run] MISSING expected employee for ${b.bareName} ${b.outlet} (${b.realEmail}) — skip.`);
      continue;
    }

    const candidates = await prisma.employee.findMany({
      where: {
        id: { not: mine.id },
        homePlace: b.outlet,
        name: { equals: b.bareName },
      },
      include: {
        _count: {
          select: { vouchers: true, attendances: true, payslipItems: true, kasbonRequests: true, loginEvents: true },
        },
      },
    });

    for (const dup of candidates) {
      found++;
      console.log(
        `[dry-run] DUPLICATE: "${dup.name}" (${dup.code}, email=${dup.email}) at ${dup.homePlace} ` +
          `duplicates "${mine.name}" (${mine.code}, email=${mine.email}) — ` +
          `dup has vouchers=${dup._count.vouchers} attendances=${dup._count.attendances} payslipItems=${dup._count.payslipItems} ` +
          `kasbon=${dup._count.kasbonRequests} loginEvents=${dup._count.loginEvents}`
      );
    }
  }

  console.log(`[dry-run] done — ${found} duplicate record(s) found.`);
}

main()
  .catch((e) => {
    console.error("[dry-run] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
