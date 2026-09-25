import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// One-off diagnostic: after the merge deploys, total employee count dropped
// by one more than expected (144 -> 109, not 110), and the DISA fixup found
// PR-047 already gone. Checking whether her vouchers actually made it to
// AR-60, or whether PR-047 was deleted (by hand, in the admin UI) before
// this ran — which would have cascade-deleted its vouchers with it.
async function main() {
  const ar60 = await prisma.employee.findUnique({ where: { code: "AR-60" }, include: { vouchers: true } });
  const pr047 = await prisma.employee.findUnique({ where: { code: "PR-047" } });
  console.log(`[check-disa] AR-60: ${ar60 ? `found, name="${ar60.name}", email=${ar60.email}, vouchers=${ar60.vouchers.length}` : "NOT FOUND"}`);
  console.log(`[check-disa] PR-047: ${pr047 ? `still exists, name="${pr047.name}", email=${pr047.email}` : "not found"}`);
  const total = await prisma.employee.count();
  console.log(`[check-disa] total employees now: ${total}`);
}

main()
  .catch((e) => {
    console.error("[check-disa] failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
