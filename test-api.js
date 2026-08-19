async function test() {
  try {
    const loginRes = await fetch("http://localhost:4000/api/v1/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "CRM0001", password: "password" })
    });
    const loginData = await loginRes.json();
    if (!loginData.data) {
       console.log("LOGIN FAILED:", loginData);
       return;
    }
    const token = loginData.data.accessToken;
    
    const res = await fetch("http://localhost:4000/api/v1/reports/cumulative-scores?period=2026-01_2026-08", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("ERROR:", data);
    } else {
      console.log("SUCCESS, rows:", data.data.length);
      console.log("DATA:", JSON.stringify(data.data, null, 2));
    }
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}
test();
