async function run() {
  try {
    const res = await fetch("http://localhost:4000/api/v1/wood-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "MANGO2" })
    });
    console.log("Status:", res.status);
    console.log("Data:", await res.json());
  } catch (err: any) {
    console.log("Error:", err.message);
  }
}
run();
