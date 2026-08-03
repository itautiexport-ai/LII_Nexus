import { ProductionEmService } from './src/modules/reports/application/services/ProductionEmService';
import { pool } from './src/infrastructure/database/mysql/connection';

async function test() {
  const service = new ProductionEmService();
  const data = await service.getProductionEmReport('2026-06-30', '2026-07-21');
  console.log(data);
  pool.end();
}
test();
