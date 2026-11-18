// Runs the form's actual summary and saved expense expressions without a database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.resolve(__dirname, '../src/modules/costing/pages/CostEstimationFormPage.tsx'), 'utf8');
const start = source.indexOf('const woodTotal = computeWoodTotalAmount();', source.indexOf('{/* Grand Total Summary Card */}'));
const end = source.indexOf('const activeUsdRate', start);
assert(start >= 0 && end > start, 'Summary calculations must exist');
const summaryCode = source.slice(start, end) + '\n({totalCostBeforeExpenses, calculatedExpensesAmt, totalAfterExpenses, profitAmt, grandTotal});';
const ast = ts.createSourceFile('form.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let savedExpense;
function visit(node) {
  if (ts.isObjectLiteralExpression(node) && node.properties.some(p => ts.isPropertyAssignment(p) && p.name.getText(ast) === 'item_name' && p.initializer.getText(ast).includes('`Expenses (${summaryExpensesPct}%)`'))) savedExpense = node.getText(ast);
  ts.forEachChild(node, visit);
}
visit(ast);
assert(savedExpense, 'Saved expenses item must exist');
const savedCode = ts.transpileModule(`const saved = (${savedExpense}); saved;`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
for (const fixture of [
  { expense: 20, margin: 26, other: 40, before: 1350, overhead: 270, after: 1660, profit: 431.6, total: 2091.6 },
  { expense: 0, margin: 0, other: 0, before: 1350, overhead: 0, after: 1350, profit: 0, total: 1350 },
  { expense: 12.5, margin: 10, other: 25, before: 1350, overhead: 168.75, after: 1543.75, profit: 154.375, total: 1698.125 },
]) {
  const context = { summaryExpensesPct: fixture.expense, marginPercentage: fixture.margin, computeOtherExpensesTotalAmount: () => fixture.other };
  for (const [name, amount] of Object.entries({ Wood: 700, Metal: 50, Hardware: 100, Upholstery: 25, Additional: 75, Labour: 50, Polish: 200, Packaging: 100, Forwarding: 50 })) context[`compute${name}TotalAmount`] = () => amount;
  const summary = vm.runInNewContext(summaryCode, context);
  const saved = vm.runInNewContext(savedCode, context);
  for (const [field, expected] of Object.entries({ totalCostBeforeExpenses: fixture.before, calculatedExpensesAmt: fixture.overhead, totalAfterExpenses: fixture.after, profitAmt: fixture.profit, grandTotal: fixture.total })) assert(Math.abs(summary[field] - expected) < 1e-8, `${field}: expected ${expected}, got ${summary[field]}`);
  assert.equal(saved.unit_cost, fixture.overhead, 'Saved overhead must equal displayed calculated expenses');
}
console.log('PASS: costing sequence, 20% default scenario, zero and fractional rates, other expenses once, profit after expenses, and saved/displayed expense parity.');
