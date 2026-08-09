import { parseFrontmatter } from 'astro/markdown';
import type { LiveLoader } from 'astro/loaders';

interface Heading {
  depth: number;
  slug: string;
  text: string;
}

interface GitHubContentEntry {
  name: string;
  path: string;
  type: 'dir' | 'file';
  download_url: string | null;
}

interface PostData extends Record<string, unknown> {
  body: string;
  headings: Heading[];
}

class GitHubContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubContentError';
  }
}

function contentConfig() {
  const repository = import.meta.env.CONTENT_REPOSITORY ?? 'yw7148/blog.youngwon.me-content';
  const ref = import.meta.env.CONTENT_REF ?? 'main';

  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new GitHubContentError('CONTENT_REPOSITORY must use the owner/repository format.');
  }

  if (!ref || /[\r\n]/.test(ref)) {
    throw new GitHubContentError('CONTENT_REF must be a valid Git ref.');
  }

  return { repository, ref, token: import.meta.env.GITHUB_TOKEN };
}

function githubHeaders(accept = 'application/vnd.github+json') {
  const { token } = contentConfig();

  return {
    Accept: accept,
    'User-Agent': 'youngwon-tech-blog-live-content',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function githubRequest(path: string, init?: RequestInit) {
  const { repository } = contentConfig();
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    ...init,
    headers: { ...githubHeaders(), ...init?.headers },
  });

  if (!response.ok) {
    throw new GitHubContentError(
      `GitHub request failed (${response.status} ${response.statusText}): ${path}`,
    );
  }

  return response;
}

async function listMarkdownFiles(path = 'posts'): Promise<GitHubContentEntry[]> {
  const { ref } = contentConfig();
  const response = await githubRequest(`/contents/${path}?ref=${encodeURIComponent(ref)}`);
  const entries = (await response.json()) as GitHubContentEntry[] | GitHubContentEntry;

  if (!Array.isArray(entries)) {
    throw new GitHubContentError(`Expected ${path} to be a directory in the content repository.`);
  }

  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (entry.type === 'dir') return listMarkdownFiles(entry.path);
      if (entry.type === 'file' && entry.name.endsWith('.md') && entry.download_url) return [entry];
      return [];
    }),
  );

  return nested.flat();
}

async function downloadMarkdown(url: string) {
  const response = await fetch(url, { headers: githubHeaders('text/plain') });

  if (!response.ok) {
    throw new GitHubContentError(
      `Could not download Markdown (${response.status} ${response.statusText}).`,
    );
  }

  return response.text();
}

function headingText(markdown: string) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .trim();
}

function extractHeadings(body: string) {
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  const counts = new Map<string, number>();
  const headings: Heading[] = [];

  for (const match of withoutCode.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)) {
    const text = headingText(match[2]);
    const base = text
      .toLowerCase()
      .replace(/[^\p{Letter}\p{Number}\s_-]/gu, '')
      .trim()
      .replace(/\s+/g, '-');
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    headings.push({ depth: match[1].length, slug: count === 0 ? base : `${base}-${count}`, text });
  }

  return headings;
}

function injectHeadingIds(html: string, headings: Heading[]) {
  let index = 0;

  return html.replace(/<h([1-6])([^>]*)>/g, (tag, depth: string, attributes: string) => {
    const heading = headings[index++];
    if (!heading || heading.depth !== Number(depth) || /\sid=/.test(attributes)) return tag;
    return `<h${depth}${attributes} id="${heading.slug}">`;
  });
}

function parsePost(markdown: string): PostData {
  const { frontmatter, content: body } = parseFrontmatter(markdown);
  return { ...frontmatter, body, headings: extractHeadings(body) } as PostData;
}

function postId(path: string) {
  return path.replace(/^posts\//, '').replace(/\.md$/, '');
}

function markdownUrl(id: string) {
  const { repository, ref } = contentConfig();
  const path = `posts/${id}.md`;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${repository}/${encodeURIComponent(ref)}/${encodedPath}`;
}

async function renderMarkdown(body: string) {
  const { repository } = contentConfig();
  const response = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({ text: body, mode: 'gfm', context: repository }),
  });

  if (!response.ok) {
    throw new GitHubContentError(
      `Could not render Markdown (${response.status} ${response.statusText}).`,
    );
  }

  return response.text();
}

async function loadPost(id: string, renderBody: boolean) {
  if (!/^[A-Za-z0-9_.\/-]+$/.test(id) || id.split('/').includes('..')) return undefined;

  const response = await fetch(markdownUrl(id), { headers: githubHeaders('text/plain') });
  if (response.status === 404) return undefined;
  if (!response.ok) {
    throw new GitHubContentError(`Could not download post ${id} (${response.status}).`);
  }

  const data = parsePost(await response.text());
  const rendered = renderBody
    ? { html: injectHeadingIds(await renderMarkdown(data.body), data.headings) }
    : undefined;

  return { id, data, rendered, cacheHint: { tags: [`post:${id}`] } };
}

export function githubPostsLoader(): LiveLoader<
  PostData,
  { id: string },
  never,
  GitHubContentError
> {
  return {
    name: 'github-posts-live-loader',
    async loadCollection() {
      try {
        const files = await listMarkdownFiles();
        const entries = await Promise.all(
          files.map(async (file) => {
            const markdown = await downloadMarkdown(file.download_url!);
            return { id: postId(file.path), data: parsePost(markdown) };
          }),
        );
        return { entries, cacheHint: { tags: ['posts'] } };
      } catch (error) {
        return { error: error instanceof GitHubContentError ? error : new GitHubContentError(String(error)) };
      }
    },
    async loadEntry({ filter }) {
      try {
        return await loadPost(filter.id, true);
      } catch (error) {
        return { error: error instanceof GitHubContentError ? error : new GitHubContentError(String(error)) };
      }
    },
  };
}
