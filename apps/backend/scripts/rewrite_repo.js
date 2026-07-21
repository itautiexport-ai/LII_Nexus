const fs = require('fs');
const path = require('path');
const repoPath = path.join(__dirname, '../src/modules/masterdata/infrastructure/repositories/MySqlMasterDataRepository.ts');
let code = fs.readFileSync(repoPath, 'utf8');

function replaceDelete(table, method) {
  const regex = new RegExp(`async ${method}\\(id: string\\) \\{\\s*await pool\\.query\\("UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = \\?", \\[id\\]\\);\\s*\\}`);
  const replacement = `async ${method}(id: string) {
    try {
      await pool.query("DELETE FROM ${table} WHERE id = ?", [id]);
    } catch (err: any) {
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        await pool.query("UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP, name = CONCAT(name, '-del-', SUBSTRING(id, 1, 6)) WHERE id = ?", [id]);
      } else throw err;
    }
  }`;
  code = code.replace(regex, replacement);
}

replaceDelete('wood_types', 'deleteWoodType');
replaceDelete('priorities', 'deletePriority');
replaceDelete('master_data_buyers', 'deleteBuyer');
replaceDelete('uoms', 'deleteUom');

fs.writeFileSync(repoPath, code);
console.log("Rewrote MySqlMasterDataRepository.ts");
