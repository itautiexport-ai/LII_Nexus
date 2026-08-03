const fs = require('fs');
const path = require('path');

function replaceFile(filePath, table, method) {
  let code = fs.readFileSync(filePath, 'utf8');
  const regex = new RegExp(`async ${method}\\(id: string\\): Promise<void> \\{\\s*await pool\\.query\\("UPDATE ${table} SET deleted_at = NOW\\(\\) WHERE id = \\?", \\[id\\]\\);\\s*\\}`);
  const replacement = `async ${method}(id: string): Promise<void> {
    try {
      await pool.query("DELETE FROM ${table} WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE ${table} SET deleted_at = NOW(), name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }`;
  code = code.replace(regex, replacement);
  fs.writeFileSync(filePath, code);
  console.log("Rewrote " + filePath);
}

replaceFile(path.join(__dirname, '../src/modules/organization/infrastructure/repositories/MySqlDesignationRepository.ts'), 'designations', 'softDelete');
replaceFile(path.join(__dirname, '../src/modules/factory/infrastructure/repositories/MySqlShiftRepository.ts'), 'shifts', 'softDelete');
replaceFile(path.join(__dirname, '../src/modules/factory/infrastructure/repositories/MySqlContractorRepository.ts'), 'contractors', 'softDelete');

