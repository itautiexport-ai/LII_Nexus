import jwt from "jsonwebtoken";
import { env } from "./src/config/env";
import { pool } from "./src/infrastructure/database/mysql/connection";

async function run() {
  const [rows] = await pool.query("SELECT * FROM users LIMIT 1");
  const user = (rows as any)[0];
  const token = jwt.sign({ sub: user.id }, env.jwt.accessSecret, { expiresIn: '1h' });
  
  try {
    const res = await fetch("http://localhost:4000/api/v1/documents", {
      method: "POST",
      body: JSON.stringify({
        title: "Test",
        category: "sop",
        fileName: "WhatsApp Image 2026-07-09 at 11.06.33 AM.jpeg",
        fileUrl: "https://files.example.com/WhatsApp%20Image%202026-07-09%20at%2011.06.33%20AM.jpeg",
        isConfidential: true,
        changeNotes: "Brief notes about this document..."
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Origin": "http://192.168.0.50:5173"
      }
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Error response:", data);
    } else {
      console.log("Success:", data);
    }
  } catch (err: any) {
    console.error("Network Error:", err.message);
  }
  process.exit(0);
}
run();
