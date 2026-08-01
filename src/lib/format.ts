export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function canonicalUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}

export const SITE_URL = 'https://blog.youngwon.me';
