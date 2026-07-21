import bcrypt from "bcryptjs";
async function run() {
  const hash = "$2a$12$0QkbMDVzvafm9LaHMwOcZ.f/ZFK1pWgHi0ii3ZfcZsnp9b9UWav2y";
  console.log("Lokesh@123:", await bcrypt.compare("Lokesh@123", hash));
  console.log("lokesh123:", await bcrypt.compare("lokesh123", hash));
  console.log("LOKESH123:", await bcrypt.compare("LOKESH123", hash));
  console.log("Lii@123:", await bcrypt.compare("Lii@123", hash));
}
run();
