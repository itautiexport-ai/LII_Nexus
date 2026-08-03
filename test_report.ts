import { ProductionEmService } from "./apps/backend/src/modules/reports/application/services/ProductionEmService";

async function run() {
  try {
    const srv = new ProductionEmService();
    const res = await srv.getProductionEmReport("2026-07");
    console.log(res);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
