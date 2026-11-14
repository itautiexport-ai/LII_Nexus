// Exercise the built service's calendar helpers in several host timezones, no DB writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
if (!process.argv.includes('--zone-case')) {
  for (const zone of ['UTC', 'Asia/Kolkata', 'America/New_York']) {
    const child = spawnSync(process.execPath, [__filename, '--zone-case'], { env: {...process.env, TZ:zone}, encoding:'utf8' });
    assert.equal(child.status, 0, child.stdout + child.stderr);
    process.stdout.write(child.stdout);
  }
} else {
  const built=fs.readFileSync(path.join(__dirname,'../dist/modules/checklist/application/services/StandaloneChecklistService.js'),'utf8');
  const index=built.indexOf('function isIstSunday(');
  assert.ok(index > 0, 'Built service helpers required; run backend build first');
  const helpers=vm.runInNewContext(built.slice(index)+'\n; ({getNextOccurrenceDate, isIstSunday, getIstDateStr})', {Date,Intl});
  const cases=[
    ['Daily','2026-11-14T03:30:00.000Z','2026-11-15T03:30:00.000Z'],
    ['Alternate','2026-11-14T03:30:00.000Z','2026-11-16T03:30:00.000Z'],
    ['Weekly','2026-11-14T03:30:00.000Z','2026-11-21T03:30:00.000Z'],
    ['Fortnightly','2026-11-14T03:30:00.000Z','2026-11-28T03:30:00.000Z'],
    [' biweekly ','2026-11-14T18:00:00.000Z','2026-11-28T18:00:00.000Z'],
    ['bi-weekly','2026-12-25T03:30:00.000Z','2027-01-08T03:30:00.000Z'],
    ['Fortnightly','2026-03-07T03:30:00.000Z','2026-03-21T03:30:00.000Z'],
    ['Alternate','2026-03-07T03:30:00.000Z','2026-03-09T03:30:00.000Z'],
    ['Monthly','2027-01-31T19:00:00.000Z','2027-02-28T19:00:00.000Z'],
    ['Quarterly','2026-11-14T03:30:00.000Z','2027-02-14T03:30:00.000Z'],
    ['Yearly','2026-11-14T03:30:00.000Z','2027-11-14T03:30:00.000Z'],
  ];
  for(const [frequency,start,expected] of cases) assert.equal(helpers.getNextOccurrenceDate(new Date(start),frequency).toISOString(),expected,frequency);
  const first=helpers.getNextOccurrenceDate(new Date('2026-11-14T03:30:00Z'),'Fortnightly');
  assert.equal(helpers.getNextOccurrenceDate(first,'Fortnightly').toISOString(),'2026-12-12T03:30:00.000Z');
  assert.equal(helpers.isIstSunday(new Date('2026-11-14T19:00:00Z')),true);
  assert.equal(helpers.getIstDateStr(new Date('2026-11-14T19:00:00Z')),'2026-11-15');
  console.log(`PASS ${process.env.TZ}: Alternate/Fortnightly, aliases, IST time preservation, month/year boundaries, DST independence and Sunday/date helpers.`);
}
