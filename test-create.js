const axios = require("axios");

async function run() {
  try {
    // We need to login first
    const loginRes = await axios.post("http://localhost:4000/api/v1/auth/login", {
      email: "admin@example.com", // Assuming this is an admin, or I will use DB credentials
      password: "password123" // Assuming default password
    });
    
    console.log("Logged in");
    
    // Now create
    const res = await axios.post("http://localhost:4000/api/v1/employees", {
      employeeCode: "123",
      fullName: "LOKESH KUMAWAT",
      departmentId: null,
      designationId: null,
      managerId: null,
      dateOfJoining: "2026-07-01",
      birthday: "2026-07-20",
    }, {
      headers: { Authorization: `Bearer ${loginRes.data.data.accessToken}` }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
run();
