export const SITE = {
  title: 'Youngwon Tech Blog',
  description:
    '완료 기준과 반드시 지켜야 할 조건을 세우고, 설계부터 운영까지 검증한 과정을 기록하는 백엔드 기술 블로그.',
  url: 'https://blog.youngwon.me',
  author: 'Youngwon Kim',
  locale: 'ko_KR',
  categories: [
    {
      title: '설계와 모델링',
      tag: 'Domain Design',
    },
    {
      title: '경계와 일관성',
      tag: 'Spring',
    },
    {
      title: 'API와 협업',
      tag: 'API Design',
    },
    {
      title: '운영과 성능',
      tag: 'Operations',
    },
  ],
} as const;

export const AUTHOR = {
  name: SITE.author,
  url: new URL('/about/', SITE.url).toString(),
  description:
    '완료의 기준을 스스로 세우고, 반드시 지켜야 할 조건이 실제로 충족되는지 끝까지 확인하는 백엔드 개발자입니다.',
  portfolio: 'https://youngwon.me/ko',
  github: 'https://github.com/yw7148',
  email: 'mailto:youngwon@youngwon.me',
} as const;
