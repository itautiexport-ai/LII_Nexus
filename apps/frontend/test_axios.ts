import axios from "axios";
async function run() {
  try {
    // hit the API
    await axios.post("http://localhost:3000/api/v1/departments", { name: "ASSEMBLY", code: "0003" });
  } catch (err: any) {
    console.log("Error response data:");
    console.log(err.response?.data);
  }
}
run();
