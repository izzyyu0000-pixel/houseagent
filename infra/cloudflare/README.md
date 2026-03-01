# Cloudflare Blog Proxy Runbook

## Goal

Proxy only `https://domain.com/blog*` to Cloudflare Pages origin `https://blog-origin.domain.com` while keeping SEO canonical URLs on `domain.com/blog/...`.

## Worker File

- Worker entry: `/Users/user/Documents/houseagent/infra/cloudflare/worker/blog-proxy.js`
- Behavior summary:
  - Handles only `/blog` and `/blog/*`.
  - Strips `/blog` prefix before proxying to `https://blog-origin.domain.com`.
  - Preserves query string.
  - Preserves status code and response body.
  - Copies headers after hop-by-hop safety filtering.
  - Uses fixed upstream origin only (no request-driven target URL).

## Route Setup

1. Deploy the Worker.
2. Bind Worker route:
   - `domain.com/blog*`
3. Do not attach this Worker to broader routes (e.g. `domain.com/*`).

## Bulk Redirect Setup

Create a Bulk Redirect rule set to consolidate Pages preview domain into main domain:

- Source URL pattern: `https://*.pages.dev/*`
- Target URL: `https://domain.com/blog/$1` (where `$1` is the wildcard path capture)
- Status: `301`
- Preserve query string: `on`

Notes:
- Keep this redirect on `*.pages.dev` host scope only.
- Do not create a reverse redirect from `domain.com` to `*.pages.dev`, otherwise loop risk increases.

## SEO Notes

- Canonical and Open Graph URL should point to `https://domain.com/blog/...`.
- Upstream `pages.dev` should only 301 to `domain.com/blog/...`.
- This avoids duplicate indexing and SEO split.

## Security Constraints

- No open redirect: target origin is hardcoded/configured via trusted env only.
- No external target URL injection from query/path/headers.
- Worker does not accept user-supplied redirect target parameters.

## Edge Cases Checklist

1. `/blog` and `/blog/` both proxy to upstream `/`.
2. `/blog/_astro/*` proxies to `/_astro/*` unchanged.
3. `*.pages.dev` redirects to `domain.com/blog/*` without loop.
4. Non-`/blog` paths are unaffected (and should not be routed to this Worker).

## Validation Commands (Local Harness)

Run local harness:

```bash
node /Users/user/Documents/houseagent/infra/cloudflare/worker/local-test-server.mjs
```

Then run:

```bash
curl -si 'http://127.0.0.1:9797/blog'
curl -si 'http://127.0.0.1:9797/blog/'
curl -si 'http://127.0.0.1:9797/blog/_astro/app.js'
curl -si 'http://127.0.0.1:9797/blog/echo?x=1&y=2'
curl -si 'http://127.0.0.1:9797/blog/status/404'
curl -si 'http://127.0.0.1:9797/not-blog'
curl -si -X POST 'http://127.0.0.1:9797/blog/echo?via=post' -d 'ok=1'
curl -si 'http://127.0.0.1:9797/blog//double//slashes?z=9'
```

Expected vs actual (latest local run on 2026-03-01):

1. `GET /blog`
   - Expected: `200`, body `origin-home`, upstream path `/`.
   - Actual: `200`, body `origin-home`, header `x-origin-path: /`.
2. `GET /blog/`
   - Expected: `200`, body `origin-home`, upstream path `/`.
   - Actual: `200`, body `origin-home`, header `x-origin-path: /`.
3. `GET /blog/_astro/app.js`
   - Expected: `200`, JS body, upstream path `/_astro/app.js`.
   - Actual: `200`, `content-type: application/javascript`, `x-origin-path: /_astro/app.js`.
4. `GET /blog/echo?x=1&y=2`
   - Expected: `200`, query preserved.
   - Actual: `200`, JSON `{"method":"GET","path":"/echo","query":"x=1&y=2"}`.
5. `GET /blog/status/404`
   - Expected: `404` passthrough.
   - Actual: `404`, body `origin-not-found`.
6. `GET /not-blog`
   - Expected: not proxied by harness.
   - Actual: `204`, header `X-Worker-Bypass: 1`.
7. `POST /blog/echo?via=post` with body
   - Expected: `200`, method preserved (`POST`), no runtime error.
   - Actual: `200`, JSON `{"method":"POST","path":"/echo","query":"via=post"}`.
8. `GET /blog//double//slashes?z=9`
   - Expected: query preserved and path forwarded after `/blog`.
   - Actual: `200`, body `origin:/double//slashes` (leading `//` normalized to safe single `/`).

Staging validation (Cloudflare route + redirect):

```bash
curl -si 'https://domain.com/blog/'
curl -si 'https://domain.com/blog/posts/'
curl -si 'https://<project>.pages.dev/posts/test-slug?utm=abc'
```

Expected:
1. `domain.com/blog/*` responds from blog origin, status as upstream.
2. `pages.dev/*` responds `301` to `https://domain.com/blog/*` and preserves query string.
3. No redirect loop between `pages.dev` and `domain.com`.

## Rollback (Failure Recovery)

1. Disable Worker route binding `domain.com/blog*`.
2. Keep DNS / origin as-is for main site.
3. Disable Bulk Redirect rule `*.pages.dev/* -> domain.com/blog/*` if redirect behavior is faulty.
4. Re-enable previous routing rule set (if any) from infra change record.
5. Purge Cloudflare cache for:
   - `/blog/*`
   - affected `pages.dev` paths

## Quick Rollback Commands (Wrangler example)

```bash
# 1) Remove route binding
wrangler routes delete domain.com/blog* --zone-name domain.com

# 2) (Optional) rollback worker deployment by re-deploying previous version
wrangler deployments list
wrangler rollback <DEPLOYMENT_ID>
```

If `wrangler rollback` is not available in your plan/version, redeploy the previously tagged Worker script and rebind routes.
