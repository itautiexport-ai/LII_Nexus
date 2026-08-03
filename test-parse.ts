import { FileParsingService } from "./apps/backend/src/modules/upload/application/services/FileParsingService";

async function run() {
  const service = new FileParsingService();
  const res = await service.parseSalarySheet("apps/backend/uploads/7c6d7e7f-4c47-4ae5-a10a-b52fe75252cc.pdf");
  console.log(res);
}

run().catch(console.error);
