const axios = require("axios");

async function run() {
  try {
    const res = await axios.post("http://localhost:4000/api/v1/employees", {
      employeeCode: "123",
      fullName: "LOKESH KUMAWAT",
      departmentId: "30ed1d6e-48a4-477d-a05d-fbb69ce650e9", // some valid department
      designationId: null,
      managerId: null,
      dateOfJoining: "2026-07-01",
      birthday: "2026-07-20",
    }, {
      headers: { Authorization: "Bearer ANY" } // Wait, how to auth?
    });
  } catch (err) {}
}
