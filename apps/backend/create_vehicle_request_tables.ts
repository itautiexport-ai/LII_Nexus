import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "lii_nexus_app",
    password: "Lii@123",
    database: "lii_nexus",
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS hr_vehicle_requests (
      id VARCHAR(36) PRIMARY KEY,
      requester_name VARCHAR(255) NOT NULL,
      department VARCHAR(255) NULL,
      travel_date DATE NOT NULL,
      travel_time VARCHAR(50) NULL,
      destination VARCHAR(255) NOT NULL,
      purpose VARCHAR(500) NULL,
      passengers_count INT DEFAULT 1,
      vehicle_type VARCHAR(100) DEFAULT 'Car',
      remarks TEXT NULL,
      status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Table hr_vehicle_requests created successfully!");
  await conn.end();
}

main().catch(console.error);
