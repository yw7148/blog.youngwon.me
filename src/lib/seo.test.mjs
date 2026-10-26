import assert from 'node:assert/strict';
import test from 'node:test';
import { getPostCanonical, getPostImage, getPostUrl, serializeJsonLd } from './seo.ts';

test('uses self-referencing canonical URLs unless a post declares its original URL', () => {
  assert.equal(getPostCanonical({ id: 'example', data: {} }), 'https://blog.youngwon.me/posts/example/');
  assert.equal(
    getPostCanonical({ id: 'example', data: { canonicalUrl: 'https://example.com/original' } }),
    'https://example.com/original',
  );
  assert.notEqual(
    getPostCanonical({ id: 'example', data: { canonicalUrl: 'https://example.com/original' } }),
    getPostUrl('example'),
  );
});

test('prefers the explicit sharing image over the first content image', () => {
  assert.deepEqual(getPostImage({
    title: '글 제목',
    body: '![본문 이미지](https://example.com/body.png)',
    ogImage: '/images/share.png',
    ogImageAlt: '공유 이미지 설명',
  }), {
    url: 'https://blog.youngwon.me/images/share.png',
    alt: '공유 이미지 설명',
    isDefault: false,
  });
});

test('uses a representative content image while skipping samples and SVG diagrams', () => {
  for (const fence of ['```', '~~~']) {
    assert.deepEqual(getPostImage({
      title: '글 제목',
      body: `${fence}markdown\n![예제](https://example.com/sample.png)\n${fence}\n\n` +
        '`![인라인 예제](https://example.com/inline.png)`\n\n' +
        '![다이어그램](https://example.com/flow.svg)\n\n' +
        '![대표 이미지](<https://example.com/hero.png> "이미지 제목")',
    }), { url: 'https://example.com/hero.png', alt: '대표 이미지', isDefault: false });
  }
});

test('falls back safely when images are missing, relative, malformed, or unsupported', () => {
  for (const image of ['images/relative.png', '//example.com/image.png', 'https://',
    'data:image/png;base64,a', 'javascript:alert(1)', 'https://example.com/flow.svg',
    'https://user:password@example.com/image.png']) {
    const result = getPostImage({ title: '글 제목', body: `![이미지](${image})`, ogImage: image });
    assert.equal(result.url, 'https://blog.youngwon.me/og-default.png');
    assert.equal(result.isDefault, true);
  }
  assert.equal(getPostImage({ title: '글 제목', body: '' }).isDefault, true);
  assert.equal(getPostImage({ title: '글 제목', body: '![](/hero.png)' }).alt, '글 제목');
});

test('keeps content from closing the JSON-LD script element', () => {
  const input = { headline: '</script><script>alert("x")</script>', description: '한글 & 인용 "문자"' };
  const output = serializeJsonLd(input);
  assert.equal(output.includes('<'), false);
  assert.deepEqual(JSON.parse(output), input);
});
