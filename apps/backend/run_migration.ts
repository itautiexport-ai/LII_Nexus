import { runMigrations } from "./src/infrastructure/database/mysql/runMigrations";
async function run() {
  await runMigrations();
  process.exit(0);
}
run();
