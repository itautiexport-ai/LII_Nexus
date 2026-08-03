import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "lii_nexus_app",
    password: "Lii@123",
    database: "lii_nexus",
  });

  // 1. Add planning columns to hr_vehicle_requests
  const alterColumns = [
    "ALTER TABLE hr_vehicle_requests ADD COLUMN driver_name VARCHAR(255) NULL AFTER remarks;",
    "ALTER TABLE hr_vehicle_requests ADD COLUMN assigned_vehicle VARCHAR(255) NULL AFTER driver_name;",
    "ALTER TABLE hr_vehicle_requests ADD COLUMN start_time VARCHAR(50) NULL AFTER assigned_vehicle;",
    "ALTER TABLE hr_vehicle_requests ADD COLUMN end_time VARCHAR(50) NULL AFTER start_time;",
    "ALTER TABLE hr_vehicle_requests ADD COLUMN route_details TEXT NULL AFTER end_time;",
  ];

  for (const q of alterColumns) {
    try {
      await conn.query(q);
      console.log("Executed:", q);
    } catch (e: any) {
      console.log("Column might exist:", e.message);
    }
  }

  // 2. Create hr_driver_routes table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS hr_driver_routes (
      id VARCHAR(36) PRIMARY KEY,
      driver_name VARCHAR(255) NOT NULL,
      vehicle_name VARCHAR(255) NOT NULL,
      route_name VARCHAR(255) NOT NULL,
      waypoints TEXT NULL,
      scheduled_date DATE NOT NULL,
      start_time VARCHAR(50) NULL,
      end_time VARCHAR(50) NULL,
      status ENUM('Scheduled', 'En Route', 'Completed') DEFAULT 'Scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("Table hr_driver_routes created successfully!");

  await conn.end();
}

main().catch(console.error);
