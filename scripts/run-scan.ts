// Standalone CLI scanner — for local cron or one-off runs.
// Usage: npx tsx scripts/run-scan.ts <profile-id>

import { getProfile } from "../lib/storage";
import { runScan } from "../lib/runner";

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error("Usage: npx tsx scripts/run-scan.ts <profile-id>");
    process.exit(1);
  }
  const profile = await getProfile(id);
  if (!profile) {
    console.error(`Profile ${id} not found`);
    process.exit(1);
  }
  console.log(`Running scan for ${profile.brand}…`);
  const record = await runScan(profile, { maxPrompts: 12 });
  const cited = record.results.filter((r) => r.cited).length;
  console.log(`Done. ${cited} of ${record.results.length} cells cited.`);
  console.log(`Saved as scan-${record.id}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
