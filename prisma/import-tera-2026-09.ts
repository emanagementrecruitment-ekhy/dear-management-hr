import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { FIELD_CITIES } from "../src/lib/constants";

const prisma = new PrismaClient();

// One-time batch onboarding of real Tera recruited via WhatsApp in
// September 2026 (see chat export "DAFTAR_TERA"). Idempotent by design —
// upserted by `email` (each row's unique key), so re-running (e.g. a
// redeploy) never duplicates anyone already created. No Level Pendapatan
// was specified for this batch, so everyone starts at CLASSIC_D (the
// lowest/starter rate, Rp 95.000/voucher) — Admin/Owner can raise
// individual Teras' level later from Data Tera. Two entries from the
// original list (Tania and one "Medika"/"rahma" row) had no usable email
// and are intentionally left out — add them by hand once real emails are
// known. Ages are computed from each person's stated birthdate as of this
// script's write date (2026-09-24) and stored once; birthDate itself
// wasn't supplied in the source list, only day/month/year text, so it's
// not populated here.
const TERA_LEVEL = "CLASSIC_D";
const ROLE = "Tera";

const ROWS: { name: string; email: string; phone: string; outlet: string; ageYears: number }[] = [
  { name: "SILA MTR", email: "evinadwiagustin04@gmail.com", phone: "087846464694", outlet: "MTR", ageYears: 23 },
  { name: "KIKA MTR", email: "ayuu1038@gmail.com", phone: "083195008255", outlet: "MTR", ageYears: 23 },
  { name: "LARAS", email: "adnankhairullah2021@gmail.com", phone: "085775050944", outlet: "MTR", ageYears: 26 },
  { name: "IREN", email: "virnasalsabila4@gmail.com", phone: "083857164007", outlet: "MA", ageYears: 20 },
  { name: "VIOLET SARIAYU", email: "koyahaje@gmail.com", phone: "085711786288", outlet: "SA", ageYears: 19 },
  { name: "AUDREY MTR", email: "deaa260608@gmail.com", phone: "089523089893", outlet: "MTR", ageYears: 18 },
  { name: "AUDREY SARIAYU", email: "wdyaaaraa7@gmail.com", phone: "083851787641", outlet: "SA", ageYears: 20 },
  { name: "MELDA MTR", email: "frasydha@gmail.com", phone: "081227517709", outlet: "MTR", ageYears: 20 },
  { name: "AMEL MEGA AYU", email: "dwisusanti9633@gmail.com", phone: "088221645954", outlet: "MA", ageYears: 21 },
  { name: "MEGAN MEGA AYU", email: "calmemegan32@gmail.com", phone: "085713093275", outlet: "MA", ageYears: 19 },
  { name: "YUMA MEGA AYU", email: "dellaamelia6712@gmail.com", phone: "085972551860", outlet: "MA", ageYears: 19 },
  { name: "SANDRA MTR", email: "puspitaneli448@gmail.com", phone: "081399813787", outlet: "MTR", ageYears: 22 },
  { name: "MELLA MTR", email: "nounauna30@gmail.com", phone: "081330572274", outlet: "MTR", ageYears: 23 },
  { name: "LINDA MTR", email: "gadissamudra179@gmail.com", phone: "088210864144", outlet: "MTR", ageYears: 24 },
  { name: "ANISA SARIAYU", email: "amiiyani555@gmail.com", phone: "085643430856", outlet: "SA", ageYears: 18 },
  { name: "MOLI MEGA AYU", email: "ur966338@gmail.com", phone: "087761240676", outlet: "MA", ageYears: 25 },
  { name: "YASMIN MEGA AYU", email: "handayanitria138@gmail.com", phone: "081572336693", outlet: "MA", ageYears: 24 },
  { name: "AZILA MEDIKA", email: "fitriyaninovi447@gmail.com", phone: "08817978728", outlet: "MEDIKA", ageYears: 23 },
  { name: "AIRA MTR", email: "nairashakila098@gmail.com", phone: "083183779624", outlet: "MTR", ageYears: 18 },
  { name: "REYNA MEDIKA", email: "psumegeh@gmail.com", phone: "085715103872", outlet: "MEDIKA", ageYears: 25 },
  { name: "DEA MTR", email: "saridwiyulia19@gmail.com", phone: "082241021784", outlet: "MTR", ageYears: 20 },
  { name: "AMEL MTR", email: "mellyalmaidah90@gmail.com", phone: "085804646144", outlet: "MTR", ageYears: 21 },
  { name: "NAYLA MEGA AYU", email: "neng123.com@icloud.com", phone: "08386488965", outlet: "MA", ageYears: 18 },
  { name: "NANA MEGA AYU", email: "mamey37@gmail.com", phone: "085768681529", outlet: "MA", ageYears: 18 },
  { name: "MELA HRV", email: "syena19nana@gmail.com", phone: "085218675966", outlet: "HRV", ageYears: 19 },
  { name: "MISKA LA", email: "rikasabela6@gmail.com", phone: "083821725366", outlet: "LA", ageYears: 22 },
  { name: "TIARA LA", email: "luluuu014@gmail.com", phone: "081220724007", outlet: "LA", ageYears: 19 },
  { name: "SHINTA MEDIKA", email: "sabilachyntia0@gmail.com", phone: "081584194323", outlet: "MEDIKA", ageYears: 22 },
  { name: "YUKI MA", email: "audyaadawiyahs@gmail.com", phone: "087753672550", outlet: "MA", ageYears: 18 },
  { name: "VANEA MEGA AYU", email: "arimahjunia@gmail.com", phone: "08980518400", outlet: "MA", ageYears: 23 },
  { name: "LALA MA", email: "rimaandina85@gmail.com", phone: "083817090892", outlet: "MA", ageYears: 20 },
  { name: "ARSYA HRV", email: "salsabilamahira10@icloud.com", phone: "082374262071", outlet: "HRV", ageYears: 22 },
  { name: "NAYA MTR", email: "diyahayusetia816@gmail.com", phone: "085712436752", outlet: "MTR", ageYears: 20 },
  { name: "ELLA MA", email: "sundusiahundus@gmail.com", phone: "085716492632", outlet: "MA", ageYears: 19 },
  { name: "MIRA MTR", email: "adetialestari60@gmail.com", phone: "085762612155", outlet: "MTR", ageYears: 27 },
  { name: "YENI MEGA AYU", email: "msalisa72@gmail.com", phone: "088289911738", outlet: "MA", ageYears: 18 },
  { name: "LISA MA", email: "putripertiwirysfiah@gmail.com", phone: "089675807524", outlet: "MA", ageYears: 21 },
  { name: "JASMINE LA", email: "ayut6776@gmail.com", phone: "085800697135", outlet: "LA", ageYears: 22 },
  { name: "TIARAA MTR", email: "kasmawatikas94@gmail.com", phone: "083819476576", outlet: "MTR", ageYears: 20 },
  { name: "CLAUDYA LA", email: "taniasintiabellatan@gmail.com", phone: "08137500108", outlet: "LA", ageYears: 19 },
  { name: "LILY MEDIKA", email: "delad2622@gmail.com", phone: "085648363431", outlet: "MEDIKA", ageYears: 19 },
  { name: "ALEA MA", email: "syaasyaady@gmail.com", phone: "0881012149575", outlet: "MA", ageYears: 19 },
  { name: "LITA SARIAYU", email: "angelikagustianingrum@gmail.com", phone: "085199717163", outlet: "SA", ageYears: 20 },
  { name: "DENADA MTR", email: "cristaliananda32@gmail.com", phone: "085641095702", outlet: "MTR", ageYears: 19 },
  { name: "SENA MEGA AYU", email: "saniasaputri0808@gmail.com", phone: "087892265571", outlet: "MA", ageYears: 24 },
  { name: "BEBY MEGA AYU", email: "meiyhaastia@gmail.com", phone: "082116371374", outlet: "MA", ageYears: 21 },
  { name: "ARA MA", email: "rikakusniawati61@gmail.com", phone: "088290302995", outlet: "MA", ageYears: 21 },
  { name: "MELA SARIAYU", email: "astutiwindy680@gmail.com", phone: "0895410092490", outlet: "SA", ageYears: 25 },
  { name: "KINA MEDIKA", email: "yanadestyana1@gmail.com", phone: "089525774718", outlet: "MEDIKA", ageYears: 19 },
  { name: "LIDYA MTR", email: "depiyana1708@gmail.com", phone: "082320604656", outlet: "MTR", ageYears: 21 },
  { name: "DISA MTR", email: "iisisnawati1811@gmail.com", phone: "08386860082", outlet: "MTR", ageYears: 20 },
  { name: "CLARISA LA", email: "levinatarida@gmail.com", phone: "0882007803437", outlet: "LA", ageYears: 18 },
];

function nextArCode(used: Set<string>, start: number): string {
  let n = start;
  let code = `AR-${String(n).padStart(2, "0")}`;
  while (used.has(code)) {
    n++;
    code = `AR-${String(n).padStart(2, "0")}`;
  }
  used.add(code);
  return code;
}

async function main() {
  const existingCodes = await prisma.employee.findMany({ where: { code: { startsWith: "AR-" } }, select: { code: true } });
  const used = new Set(existingCodes.map((e) => e.code));
  let nextNum = existingCodes.reduce((max, e) => {
    const n = Number(e.code.slice(3));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0) + 1;

  let created = 0;
  let skipped = 0;

  for (const row of ROWS) {
    try {
      const existingByEmail = await prisma.employee.findUnique({ where: { email: row.email } });
      if (existingByEmail) {
        skipped++;
        continue;
      }
      const existingByPhone = await prisma.employee.findUnique({ where: { phone: row.phone } });
      if (existingByPhone) {
        console.error(`[import-tera-2026-09] phone ${row.phone} for ${row.name} already used by ${existingByPhone.name} (${existingByPhone.code}) — skipped.`);
        skipped++;
        continue;
      }
      const city = FIELD_CITIES.find((c) => c.place === row.outlet);
      if (!city) {
        console.error(`[import-tera-2026-09] unknown outlet "${row.outlet}" for ${row.name} — skipped.`);
        skipped++;
        continue;
      }
      const code = nextArCode(used, nextNum);
      nextNum = Number(code.slice(3)) + 1;

      await prisma.employee.create({
        data: {
          code,
          name: row.name,
          email: row.email,
          phone: row.phone,
          role: ROLE,
          accessRole: "KARYAWAN",
          level: TERA_LEVEL,
          ageYears: row.ageYears,
          homeLat: city.lat,
          homeLng: city.lng,
          homePlace: city.place,
        },
      });
      created++;
    } catch (e) {
      console.error(`[import-tera-2026-09] failed to create ${row.name} (${row.email}):`, e);
      skipped++;
    }
  }

  console.log(`[import-tera-2026-09] created ${created}, skipped ${skipped} of ${ROWS.length} total.`);
}

main()
  .catch((e) => {
    console.error("[import-tera-2026-09] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
