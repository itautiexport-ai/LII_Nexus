import axios from "axios";
async function run() {
  try {
    await axios.post("http://localhost:3000/api/v1/departments", { name: "ASSEMBLY", code: "0003" });
  } catch (err: any) {
    console.log("Status:", err.response?.status);
    console.log("Data:", err.response?.data);
  }
}
run();
