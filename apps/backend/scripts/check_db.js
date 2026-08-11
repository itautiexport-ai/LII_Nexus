const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const [t1] = await conn.query("SHOW TABLES LIKE 'standalone_checklist_tasks'");
    console.log('standalone_checklist_tasks exists:', t1.length > 0);

    const [t2] = await conn.query("SHOW TABLES LIKE 'standalone_checklist_logs'");
    console.log('standalone_checklist_logs exists:', t2.length > 0);

    if (t1.length === 0) {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS standalone_checklist_tasks (
          id CHAR(36) PRIMARY KEY,
          checklist_id CHAR(36) NOT NULL,
          sr_no INT NOT NULL DEFAULT 1,
          task_name VARCHAR(255) NOT NULL,
          frequency VARCHAR(50) NOT NULL DEFAULT 'W',
          schedule_rule VARCHAR(100) NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (checklist_id) REFERENCES standalone_checklists(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Created standalone_checklist_tasks table');
    }

    if (t2.length === 0) {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS standalone_checklist_logs (
          id CHAR(36) PRIMARY KEY,
          checklist_task_id CHAR(36) NOT NULL,
          log_date DATE NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'P',
          note TEXT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_task_date (checklist_task_id, log_date),
          FOREIGN KEY (checklist_task_id) REFERENCES standalone_checklist_tasks(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Created standalone_checklist_logs table');
    }

    await conn.query("INSERT IGNORE INTO schema_migrations (filename) VALUES ('096_standalone_checklist_5w_tasks.sql')");
    console.log('Marked 096_standalone_checklist_5w_tasks.sql as applied');

    await conn.end();
  } catch (err) {
    console.error(err);
  }
})();
