import jwt from "jsonwebtoken";
async function run() {
  try {
    const token = jwt.sign(
      { sub: "f25e4f4b-8f68-4e11-95e7-59c098b77ec0", email: "admin@liinexus.com", roles: ["System Admin"] },
      "asdkj3298sdkfj298asdkfj298", { expiresIn: "15m" }
    );
    const res = await fetch("http://localhost:4000/api/v1/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({
        employeeCode: "123", fullName: "LOKESH KUMAWAT",
        departmentId: null, designationId: null, managerId: null,
        dateOfJoining: "2026-07-01", birthday: "2026-07-20",
      })
    });
    console.log("Create status:", res.status);
    console.log("Create body:", await res.json());
  } catch(e) {}
}
run();
