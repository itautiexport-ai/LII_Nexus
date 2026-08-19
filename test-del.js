const mysql = require('mysql2/promise');
async function test() {
  const pool = mysql.createPool({ user: 'root', password: 'password', database: 'lii_nexus' }); // Wait, password is Lii@123
  // I will just use mysql CLI
}
