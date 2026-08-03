const fs = require('fs');
const path = require('path');
const dir = 'src/infrastructure/database/mysql/migrations';
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file === '041_unify_departments.sql') continue;
  if (file === '007_factory_performance_management.sql') continue;
  if (file === '022_dpr_entry.sql') continue;
  if (file === '023_dpr_manpower_department.sql') continue;
  
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/factory_departments/g, 'departments');
  fs.writeFileSync(filePath, content);
}
console.log('Fixed migrations!');
