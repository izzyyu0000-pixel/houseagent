# Blog Architecture (Astro Subpath)

Date: 2026-03-01

## Scope

- Add a standalone Astro SSG blog under `/Users/user/Documents/houseagent/blog`.
- Target deployment path: `https://domain.com/blog`.
- Do not change existing main site business logic.

## Assumptions

1. Main site and blog are built and deployed independently.
2. Reverse proxy / hosting routes `domain.com/blog/*` to blog static assets.
3. Blog is file-based content first (Markdown/MDX), and can later connect to CMS if needed.

## Routing Strategy

- `site` is set to `https://domain.com`.
- `base` is set to `/blog`.
- `trailingSlash` is set to `always` (canonical and generated routes all end with `/`).
- Effective routes:
  - Blog home: `/blog/`
  - Post list: `/blog/posts/`
  - Post detail: `/blog/posts/:slug/`
- Internal links are explicitly written with `/blog` prefix to avoid subpath drift.

## Content Model (Collection Schema)

- Content collection: `blog` (`/Users/user/Documents/houseagent/blog/src/content.config.ts`)
- Required/defined fields:
  - `title`
  - `description`
  - `pubDate`
  - `updatedDate`
  - `slug`
  - `tags`
  - `draft`
- Note: Astro treats `slug` as a reserved routing key. In schema it is optional, and runtime routing reads `entry.slug`.
- Source files: `/Users/user/Documents/houseagent/blog/src/content/blog/*.(md|mdx)`

## Draft Policy

- Draft posts (`draft: true`) are filtered out at route generation (`getStaticPaths`) and list queries.
- Because draft pages are not generated, they are also excluded from sitemap output.

## Sitemap

- `@astrojs/sitemap` is enabled in `astro.config.mjs`.
- Build output includes `blog/dist/sitemap-index.xml` and `blog/dist/sitemap-0.xml`.
- Canonical URL and `og:url` are generated from absolute `https://domain.com/blog/...` paths to match sitemap.

## Rollback Plan

1. Remove `/Users/user/Documents/houseagent/blog`.
2. Remove this document if blog initiative is cancelled.
