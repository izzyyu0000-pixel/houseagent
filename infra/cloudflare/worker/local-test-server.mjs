import http from 'node:http';
import { handleBlogProxy } from './blog-proxy.js';

const ORIGIN_PORT = 9798;
const PROXY_PORT = 9797;

const originServer = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://127.0.0.1:${ORIGIN_PORT}`);
  const pathname = reqUrl.pathname;

  res.setHeader('X-Origin-Path', pathname);
  res.setHeader('X-Origin-Query', reqUrl.search || '');
  res.setHeader('Cache-Control', 'public, max-age=120');

  if (pathname === '/') {
    res.statusCode = 200;
    res.end('origin-home');
    return;
  }

  if (pathname === '/_astro/app.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.statusCode = 200;
    res.end('console.log("astro-asset");');
    return;
  }

  if (pathname === '/status/404') {
    res.statusCode = 404;
    res.end('origin-not-found');
    return;
  }

  if (pathname === '/echo') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        method: req.method,
        path: pathname,
        query: reqUrl.searchParams.toString(),
      }),
    );
    return;
  }

  res.statusCode = 200;
  res.end(`origin:${pathname}`);
});

const proxyServer = http.createServer(async (req, res) => {
  const requestUrl = `http://127.0.0.1:${PROXY_PORT}${req.url}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      headers.set(key, value.join(','));
    } else if (value != null) {
      headers.set(key, value);
    }
  }

  if (!(req.url === '/blog' || req.url.startsWith('/blog/'))) {
    res.statusCode = 204;
    res.setHeader('X-Worker-Bypass', '1');
    res.end();
    return;
  }

  const cfRequest = new Request(requestUrl, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
    duplex: 'half',
  });

  const workerResp = await handleBlogProxy(cfRequest, {
    BLOG_ORIGIN: `http://127.0.0.1:${ORIGIN_PORT}`,
  });

  res.statusCode = workerResp.status;
  workerResp.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (workerResp.body) {
    const body = Buffer.from(await workerResp.arrayBuffer());
    res.end(body);
    return;
  }

  res.end();
});

originServer.listen(ORIGIN_PORT, '127.0.0.1', () => {
  console.log(`origin listening on :${ORIGIN_PORT}`);
});

proxyServer.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`proxy listening on :${PROXY_PORT}`);
});
