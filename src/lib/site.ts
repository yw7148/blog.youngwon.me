export const SITE = {
  title: 'Youngwon Tech Blog',
  description:
    '백엔드 개발에서 마주친 문제와 선택지, 판단의 근거, 적용 후 남은 한계를 기록하는 기술 블로그.',
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
    'Kotlin과 Spring으로 백엔드를 개발하며, 데이터 일관성·멱등한 처리·운영 안정성을 중심으로 문제를 해결합니다.',
  portfolio: 'https://youngwon.me/ko',
  cv: 'https://youngwon.me/ko/cv',
  github: 'https://github.com/yw7148',
  email: 'mailto:youngwon@youngwon.me',
} as const;
