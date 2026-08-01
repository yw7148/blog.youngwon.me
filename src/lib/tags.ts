export function slugifyTag(tag: string) {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '');
}

export function tagHref(tag: string) {
  return `/tags/${encodeURIComponent(slugifyTag(tag))}/`;
}
