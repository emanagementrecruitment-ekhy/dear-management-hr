import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// TEMPORARY, one-shot step — requested by the business owner to wipe every
// employee currently in production (added while lokasi kerja/pendapatan were
// still placeholder data) and start fresh with only the demo fixtures.
// Clearing this guard makes cleanup-demo-employees.ts (which normally only
// ever runs once) fire one more time on this deploy's boot, then it
// re-marks itself done so it goes back to being a no-op. This script and its
// line in package.json's start:railway must be removed again right after
// this one deploy — leaving it in would wipe real employees on every future
// restart.
async function main() {
  await prisma.appSetting.upsert({
    where: { id: "singleton" },
    update: { demoCleanupAt: null },
    create: { id: "singleton", demoCleanupAt: null },
  });
  console.log("[reset-cleanup-guard] cleared demoCleanupAt — cleanup-demo-employees will run once more this boot.");
}

main()
  .catch((e) => {
    console.error("[reset-cleanup-guard] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
