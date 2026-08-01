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
      description: '의도를 코드와 모델에 어떻게 담을지, 복잡성을 어디에 둘지 판단한 과정.',
      tag: 'Domain Design',
    },
    {
      title: '경계와 일관성',
      description: '트랜잭션, 비동기 작업, 멱등성처럼 여러 실행 흐름 사이의 일관성을 지키는 방법.',
      tag: 'Spring',
    },
    {
      title: 'API와 협업',
      description: '오류 전파, 버전 전환, 호환성처럼 시스템과 팀 사이의 계약을 안전하게 바꾸는 기준.',
      tag: 'API Design',
    },
    {
      title: '운영과 성능',
      description: '배포, 메시지 처리, 실시간 집계와 성능 회귀처럼 운영 환경에서만 드러나는 문제의 추적 과정.',
      tag: 'Operations',
    },
  ],
} as const;
