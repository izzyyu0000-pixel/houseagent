const DEFAULT_BLOG_ORIGIN = 'https://blog-origin.domain.com';
const BLOG_PREFIX = '/blog';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
]);

function normalizePath(pathname) {
  if (pathname === BLOG_PREFIX || pathname === `${BLOG_PREFIX}/`) {
    return '/';
  }
  const stripped = pathname.slice(BLOG_PREFIX.length) || '/';
  // Prevent protocol-relative form (`//host/path`) from being interpreted as a host switch.
  return `/${stripped.replace(/^\/+/, '')}`;
}

function sanitizeResponseHeaders(headers) {
  const out = new Headers();
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) continue;
    out.set(key, value);
  }
  return out;
}

function sanitizeRequestHeaders(headers) {
  const out = new Headers();
  for (const [key, value] of headers.entries()) {
    const lower = key.toLowerCase();
    if (lower === 'host' || HOP_BY_HOP_HEADERS.has(lower)) continue;
    out.set(key, value);
  }
  return out;
}

function resolveOrigin(env) {
  const configured = env?.BLOG_ORIGIN || DEFAULT_BLOG_ORIGIN;
  const parsed = new URL(configured);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('BLOG_ORIGIN must use http or https');
  }
  return `${parsed.protocol}//${parsed.host}`;
}

export async function handleBlogProxy(request, env = {}) {
  const incomingUrl = new URL(request.url);

  // Route-level safety: ignore non /blog paths entirely.
  if (!incomingUrl.pathname.startsWith(BLOG_PREFIX)) {
    return fetch(request);
  }

  const blogOrigin = resolveOrigin(env);
  const targetPath = normalizePath(incomingUrl.pathname);

  // Open redirect prevention: fixed origin + normalized path only.
  const upstreamUrl = new URL(targetPath, blogOrigin);
  upstreamUrl.search = incomingUrl.search;

  const init = {
    method: request.method,
    headers: sanitizeRequestHeaders(request.headers),
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    // Needed by Node/Undici test runtime when streaming request bodies.
    init.duplex = 'half';
  }

  const upstreamResponse = await fetch(upstreamUrl.toString(), init);
  const safeHeaders = sanitizeResponseHeaders(upstreamResponse.headers);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: safeHeaders,
  });
}

export default {
  async fetch(request, env) {
    return handleBlogProxy(request, env);
  },
};
