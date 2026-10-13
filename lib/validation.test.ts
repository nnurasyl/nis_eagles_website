import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSchoolEmail, normalizeEmail, validateClub, validPassword } from './validation';
import { INITIAL_SHANYRAKS } from './shanyraks';
test('school address restriction rejects lookalike domains and malformed addresses', () => {
  for (const email of ['person@gmail.com','@hbalm.nis.edu.kz','person@hbalm.nis.edu.kz.evil.com','person@other.nis.edu.kz','person space@hbalm.nis.edu.kz','x@@hbalm.nis.edu.kz']) assert.equal(isSchoolEmail(email),false);
  assert.equal(isSchoolEmail('Student@hbalm.nis.edu.kz'),true);
  assert.equal(normalizeEmail(' Student@hbalm.nis.edu.kz '),'student@hbalm.nis.edu.kz');
});
test('club validation checks bounds and category', () => {
  const good = {name:'Debate Club',description:'A place to practise public speaking.',category:'Academic',meeting:'Friday · Room 204'};
  assert.equal(validateClub(good),null);
  assert.ok(validateClub({...good,name:'a'})); assert.ok(validateClub({...good,description:'Short'}));
  assert.ok(validateClub({...good,category:'Invalid'})); assert.ok(validateClub({...good,meeting:''}));
});
test('all 20 Shanyraks begin at zero and passwords have bounds', () => {
  assert.equal(INITIAL_SHANYRAKS.length,20); assert.equal(new Set(INITIAL_SHANYRAKS.map(x=>x.name)).size,20);
  assert.ok(INITIAL_SHANYRAKS.every(x=>x.points===0)); assert.equal(validPassword('short'),false);
  assert.equal(validPassword('a'.repeat(10)),true); assert.equal(validPassword('a'.repeat(129)),false);
});
