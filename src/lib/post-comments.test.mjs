import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCommentClientIdentifier,
  getCommentRedisKeys,
  hashCommentClientIdentifier,
  parseCommentOffset,
  validateCommentInput,
} from './post-comments.ts';

test('normalizes and validates comment input', () => {
  assert.deepEqual(validateCommentInput('  영원  ', '  좋은 글입니다.  '), {
    ok: true,
    author: '영원',
    content: '좋은 글입니다.',
  });
  assert.equal(validateCommentInput('   ', '내용').ok, false);
  assert.equal(validateCommentInput('작성자', '\n\t').ok, false);
  assert.equal(validateCommentInput('가'.repeat(21), '내용').ok, false);
  assert.equal(validateCommentInput('작성자', '가'.repeat(1_001)).ok, false);
});

test('counts Unicode code points for input limits', () => {
  assert.equal(validateCommentInput('😀'.repeat(20), '내용').ok, true);
  assert.equal(validateCommentInput('😀'.repeat(21), '내용').ok, false);
});

test('accepts only bounded non-negative comment offsets', () => {
  assert.equal(parseCommentOffset(null), 0);
  assert.equal(parseCommentOffset('20'), 20);
  assert.equal(parseCommentOffset('-1'), undefined);
  assert.equal(parseCommentOffset('1.5'), undefined);
  assert.equal(parseCommentOffset('1000001'), undefined);
});

test('uses the first platform-forwarded client address', () => {
  const headers = new Headers({
    'x-vercel-forwarded-for': '203.0.113.5, 10.0.0.1',
    'x-forwarded-for': '198.51.100.2',
  });

  assert.equal(getCommentClientIdentifier(headers), '203.0.113.5');
  assert.equal(getCommentClientIdentifier(new Headers()), 'unknown');
});

test('HMACs the client identifier without exposing the source value', async () => {
  const identifier = '203.0.113.5';
  const first = await hashCommentClientIdentifier(identifier, 'test-secret');
  const second = await hashCommentClientIdentifier(identifier, 'test-secret');

  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first.includes(identifier), false);
});

test('keeps permanent comment keys separate from the temporary rate-limit key', () => {
  assert.deepEqual(getCommentRedisKeys('hello-world', 'comment-id', 'client-hash'), {
    index: 'blog:post:hello-world:comments',
    comment: 'blog:comment:comment-id',
    rateLimit: 'blog:comment-rate:client-hash',
  });
});
