import test from 'node:test';
import assert from 'node:assert/strict';
import {schoolDate,schoolMonth,schoolDay,schoolTime} from './school-date';
test('Kazakh event dates avoid ICU placeholders and follow Almaty midnight/year rollover',()=>{
  assert.equal(schoolDate('2026-11-21T10:00:00Z','kk'),'21 қараша 2026 · 15:00');
  assert.equal(schoolMonth('2026-11-21T10:00:00Z','kk'),'қар');
  assert.equal(schoolDate('2026-12-31T20:15:00Z','kk'),'1 қаңтар 2027 · 01:15');
  assert.equal(schoolDay('2026-12-31T20:15:00Z'),'01');
  assert.equal(schoolTime('2026-12-31T20:15:00Z'),'01:15');
  assert.match(schoolDate('2026-11-21T10:00:00Z','ru'),/15:00/);
  assert.match(schoolDate('2026-11-21T10:00:00Z','en'),/15:00/);
});
