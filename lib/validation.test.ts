import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, normalizePhone, validContactPhone, normalizeEmail, validateClub, validPassword } from './validation';
import { INITIAL_SHANYRAKS } from './shanyraks';
test('Personal and corporate emails are accepted; malformed addresses are rejected',()=>{
  for(const email of ['person@gmail.com','name+club@outlook.com','Student@hbalm.nis.edu.kz','person@mail.kz'])assert.equal(isValidEmail(email),true,email);
  for(const email of ['@gmail.com','person space@gmail.com','x@@gmail.com','.x@gmail.com','x..y@gmail.com','x.@gmail.com','x@-gmail.com','x@gmail-.com','x@gmail','x@gmail.c','x@gmail.123','a'.repeat(65)+'@gmail.com'])assert.equal(isValidEmail(email),false,email);
  assert.equal(normalizeEmail(' Student@Gmail.com '),'student@gmail.com');
});
test('Contact numbers normalize harmless formatting and require an international prefix',()=>{
  assert.equal(normalizePhone('+7 (700) 123-45-67'),'+77001234567');
  for(const number of ['+7 (700) 123-45-67','+1 202 555 0123','+44 20 7946 0123'])assert.equal(validContactPhone(number),true,number);
  for(const number of ['','87001234567','+0 123456789','+7 abc 1234567','+1234567890123456','+123'])assert.equal(validContactPhone(number),false,number);
});

test('club validation checks bounds and category', () => {
  const good = {name:'Debate Club',description:'A place to practise public speaking.',category:'Academic',meeting:'Friday · Room 204'};
  assert.equal(validateClub(good),null);
  assert.ok(validateClub({...good,name:'a'})); assert.ok(validateClub({...good,description:'Short'}));
  assert.ok(validateClub({...good,category:'Invalid'})); assert.ok(validateClub({...good,meeting:''}));
});
test('all 19 Shanyraks begin at zero and passwords have bounds', () => {
  assert.equal(INITIAL_SHANYRAKS.length,19); assert.equal(new Set(INITIAL_SHANYRAKS.map(x=>x.name)).size,19);
  assert.ok(INITIAL_SHANYRAKS.every(x=>x.points===0)); assert.equal(validPassword('short'),false);
  assert.equal(validPassword('a'.repeat(10)),true); assert.equal(validPassword('a'.repeat(129)),false);
});
