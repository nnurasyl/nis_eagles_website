import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {authError, isLanguage, memberCount, messages, translate, useLanguage} from './i18n';
import {CATEGORIES} from './validation';
import {PRESIDENT, LEADERSHIP, MINISTRIES} from './government';

test('Kazakh is the default; all three languages have complete non-empty copy', () => {
  assert.equal(useLanguage.getState().language, 'kk');
  for (const [key, values] of Object.entries(messages)) {
    assert.equal(values.length, 3, key);
    for (const value of values) assert.ok(value.trim().length > 0, key);
  }
  assert.equal(isLanguage('de'), false);
  assert.equal(isLanguage('ru'), true);
});

test('Every literal interface key, category, and government role has translations', () => {
  const source = ['eagles-app.tsx','account-pages.tsx','ideas-page.tsx'].map(file=>fs.readFileSync(new URL('../components/'+file, import.meta.url),'utf8')).join('\n');
  const tree = ts.createSourceFile('eagles-app.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't' && ts.isStringLiteral(node.arguments[0])) {
      assert.ok(Object.hasOwn(messages, node.arguments[0].text), node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  for (const key of [...CATEGORIES, PRESIDENT.role, ...LEADERSHIP.map(item=>item.role), ...MINISTRIES.map(item=>item.role)]) {
    assert.ok(Object.hasOwn(messages, key), key);
  }
  // Localized labels never change the canonical values submitted to Postgres.
  assert.deepEqual(CATEGORIES, ['Creative', 'Academic', 'Technology', 'Sports', 'Community']);
  assert.equal(translate('ru', 'Academic'), 'Образование');
});

test('Participant counts follow Russian plurals and preserve Kazakh/English grammar', () => {
  assert.equal(memberCount(1, 'ru'), '1 участник');
  assert.equal(memberCount(2, 'ru'), '2 участника');
  assert.equal(memberCount(11, 'ru'), '11 участников');
  assert.equal(memberCount(21, 'ru'), '21 участник');
  assert.equal(memberCount(3, 'kk'), '3 қатысушы');
  assert.equal(memberCount(1, 'en'), '1 member');
  assert.equal(memberCount(2, 'en'), '2 members');
});

test('Auth failures are localized without exposing raw internal errors', () => {
  assert.equal(authError({code: 'invalid_credentials'}, 'ru'), 'Неверная почта или пароль.');
  assert.equal(authError({message: 'Failed to fetch'}, 'kk'), 'Байланыс үзілді. Интернетті тексеріп, қайта көр.');
  assert.equal(authError({message: 'internal database details'}, 'en'), 'Something went wrong. Please try again.');
});

test('SMTP and database signup failures get distinct localized messages', () => {
  for (const language of ['kk', 'ru', 'en'] as const) {
    assert.equal(authError({code: 'unexpected_failure', status: 500, message: 'Error sending confirmation email'}, language), translate(language, 'Email delivery failed'));
    assert.equal(authError({code: 'unexpected_failure', status: 500, message: 'Database error saving new user'}, language), translate(language, 'Account setup failed'));
  }
  assert.equal(authError({message: 'Dial tcp: address http://127.0.0.1:3000:465: too many colons in address'}, 'ru'), translate('ru', 'Email delivery failed'));
  assert.equal(authError({code: 'unexpected_failure', status: 500, message: 'private database details'}, 'en'), 'Something went wrong. Please try again.');
  assert.equal(authError({status: 429, message: 'retry in 42 seconds'}, 'kk'), translate('kk', 'Too many requests'));
  assert.equal(authError(null, 'en'), 'Something went wrong. Please try again.');
});