import { ensureDatabase } from "../src/lib/db";

async function main() {
  await ensureDatabase();
  console.log("Database schema is ready and seed data is in place.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
