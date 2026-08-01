# Youngwon Tech Blog

백엔드 개발에서 마주친 문제와 선택지, 판단의 근거와 남은 한계를 기록하는 정적 기술 블로그입니다.
Astro, TypeScript, Markdown Content Collections로 만들었습니다.

## 로컬 실행

필요한 Node.js 버전은 `package.json`의 `engines`를 따릅니다.

```sh
npm install
npm run dev
```

Cloudflare Web Analytics를 로컬 또는 Vercel에서 켜려면 다음 환경 변수를 설정합니다.

```sh
PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN=your_token
```

프로덕션 빌드는 다음 명령으로 확인합니다.

```sh
npm run build
npm run preview
```

## 글 추가 방법

글은 `src/content/posts` 아래에 Markdown 파일로 추가합니다.

```text
src/content/posts/my-post-slug.md
```

파일명이 URL slug가 됩니다. 예를 들어 `my-post-slug.md`는 `/posts/my-post-slug/`로 생성됩니다.

새 글은 다음 구조를 기본으로 작성합니다.

```markdown
---
title: "글 제목"
description: "검색 결과와 공유 카드에 표시될 설명"
publishedAt: 2026-08-01
updatedAt: 2026-08-02
tags:
  - Problem Solving
  - System Design
series: "선택 시리즈명"
canonicalUrl: "https://example.com/original"
---

## 한 줄 요약

## 상황

## 처음 생각했던 해결책

## 문제가 된 부분

## 검토한 선택지

## 최종 결정

## 적용 코드

## 남은 한계

## 정리

## 참고 자료
```

## Frontmatter

| 필드 | 필수 | 설명 |
| --- | --- | --- |
| `title` | 예 | 글 제목과 Open Graph 제목에 사용합니다. |
| `description` | 예 | 검색, RSS, 공유 메타 설명에 사용합니다. |
| `publishedAt` | 예 | 발행일입니다. |
| `updatedAt` | 아니오 | 수정일이 있을 때만 입력합니다. |
| `tags` | 예 | 태그 페이지와 글 목록에 사용합니다. |
| `series` | 아니오 | 연재 글을 묶기 위한 메타데이터입니다. |
| `canonicalUrl` | 아니오 | 외부 원문이 있을 때 canonical URL로 사용합니다. |

## 배포

Vercel에서 GitHub 저장소를 import합니다.

- Framework Preset: `Astro`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Production Domain: `blog.youngwon.me`

`astro.config.mjs`와 `src/lib/site.ts`의 사이트 URL은 `https://blog.youngwon.me`로 설정되어 있습니다. 도메인을 바꾸면 두 값을 함께 바꿔야 canonical URL, RSS, sitemap이 맞게 생성됩니다.

Cloudflare Web Analytics 토큰은 Vercel Project Settings의 Environment Variables에 `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN`으로 추가합니다.

## Cloudflare DNS 연결

Cloudflare에서 `youngwon.me` zone에 다음 레코드를 추가합니다.

```text
Type: CNAME
Name: blog
Target: cname.vercel-dns.com
Proxy status: DNS only
```

Vercel 프로젝트의 Domains 화면에서 `blog.youngwon.me`를 추가하고, Vercel이 제시하는 DNS 검증 상태가 정상인지 확인합니다.

## Google Search Console 확인 항목

도메인 연결 후 Search Console에 `https://blog.youngwon.me` 속성을 등록합니다.

- `https://blog.youngwon.me/sitemap-index.xml` 제출
- `robots.txt` 접근 확인
- 대표 글 URL 검사
- canonical URL이 self-referencing으로 인식되는지 확인
- 모바일 사용성 오류 확인

## 구현된 기능

- Astro Content Collections 기반 Markdown 글 관리
- `/`, `/posts`, `/posts/[slug]`, `/tags/[tag]`, `/about`
- RSS, Sitemap, `robots.txt`
- canonical URL, Open Graph, Twitter Card, Article JSON-LD
- Cloudflare Web Analytics 환경 변수 지원
- 작성일, 수정일, 예상 읽기 시간, 태그, 이전/다음 글
- heading anchor, 목차, 코드 복사 버튼
- 반응형 레이아웃과 다크 모드
