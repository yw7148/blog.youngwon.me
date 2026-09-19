import assert from 'node:assert/strict';
import test from 'node:test';
import { getCodeBlockText } from './code-block.ts';

test('reads code from a code element when present', () => {
  const block = {
    textContent: 'codeCopy',
    querySelector: () => ({ textContent: 'code' }),
  };

  assert.equal(getCodeBlockText(block), 'code');
});

test('reads highlighted code directly from the pre element', () => {
  const block = {
    textContent: 'highlighted code',
    querySelector: () => null,
  };

  assert.equal(getCodeBlockText(block), 'highlighted code');
});

test('returns an empty string when the block has no text', () => {
  const block = {
    textContent: null,
    querySelector: () => null,
  };

  assert.equal(getCodeBlockText(block), '');
});
