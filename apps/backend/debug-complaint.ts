import { MySqlComplaintRepository } from "./src/modules/crm/infrastructure/repositories/MySqlComplaintRepository";

async function test() {
  const repo = new MySqlComplaintRepository();
  try {
    console.log("Generating complaint number...");
    const complaintNumber = await repo.generateComplaintNumber();
    console.log("Complaint number:", complaintNumber);

    console.log("Inserting complaint...");
    const record = await repo.create({
      complaintNumber,
      title: "Test",
      status: "new" as any,
      priority: "medium",
      buyerId: null,
      assignedTo: null,
      description: "Test description"
    });
    console.log("Created successfully:", record);
  } catch (err) {
    console.error("Error creating complaint:");
    console.error(err);
  }
  process.exit();
}

test();
