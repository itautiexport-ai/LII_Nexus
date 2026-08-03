/**
 * tsc only compiles .ts files - it does not copy non-TypeScript assets like
 * the raw .sql migration/seed files into dist. Without this step, a fresh
 * `npm run build` produces a dist/ that `npm run migrate` / `npm run seed`
 * cannot find their .sql files in (ENOENT on the migrations/seeders dirs).
 * This script mirrors those two directories from src into dist after tsc runs.
 */
const fs = require("fs");
const path = require("path");

const pairs = [
  ["src/infrastructure/database/mysql/migrations", "dist/infrastructure/database/mysql/migrations"],
  ["src/infrastructure/database/mysql/seeders", "dist/infrastructure/database/mysql/seeders"],
];

for (const [srcRel, destRel] of pairs) {
  const srcDir = path.join(__dirname, "..", srcRel);
  const destDir = path.join(__dirname, "..", destRel);
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith(".sql")) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }
  console.log(`Copied .sql assets: ${srcRel} -> ${destRel}`);
}
