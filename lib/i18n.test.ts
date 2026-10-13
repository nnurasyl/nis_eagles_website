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
  const source = fs.readFileSync(new URL('../components/eagles-app.tsx', import.meta.url), 'utf8');
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
