# SEO Validation Report (Blog Subpath)

Date: 2026-03-01  
Scope: `https://domain.com/blog/*` 與 `pages.dev` 匯流策略  
Validator: local CLI + curl/grep

## 結論摘要

1. HTML canonical / og:url 在已輸出的文章與列表頁多數正確（`domain.com/blog/...`）。
2. sitemap 輸出主機已對齊 `https://domain.com`，與 canonical/robots 一致。
3. pages.dev 301 在本環境無法完成驗證（DNS 無法解析），需在 staging/正式網路再驗。

## 問題 -> 影響 -> 修復 -> 驗證

| 問題 | 影響 | 修復 | 驗證 |
|---|---|---|---|
| sitemap `<loc>` 指向舊網域（已修復） | canonical/sitemap 訊號衝突，可能被錯誤索引 | 已將 `/blog/astro.config.mjs` `site` 設為 `https://domain.com` 並重建 | `grep sitemap-0.xml` 實測全部為 `https://domain.com/blog/...` |
| pages.dev DNS/301 未驗證 | 無法證明匯流完成 | 補上 `*.pages.dev/* -> https://domain.com/blog/*` 並開通 DNS | `curl -I https://<sub>.pages.dev/` 應 301 到主網域 |
| WAF challenge 回 403（www） | 自動化探測拿不到最終內容 | 對 smoke-test IP/UA 放行或 staging 驗證 | `curl -L` 可達 200 且 body 可檢查 |

## 驗收命令（18 條）

| # | 命令 | 預期值 | 實測值 |
|---|---|---|---|
| 1 | `ASTRO_TELEMETRY_DISABLED=1 npm run build` (in `/blog`) | build 成功 | 成功，5 pages built，exit 0 |
| 2 | `test -f blog/dist/index.html` | 檔案存在 | `OK`, exit 0 |
| 3 | `rg canonical domain.com/blog/ dist/index.html` | 命中 1 筆 | 命中，exit 0 |
| 4 | `rg canonical domain.com/blog/posts/ dist/posts/index.html` | 命中 1 筆 | 命中，exit 0 |
| 5 | `rg canonical domain.com/blog/posts/... dist/posts/市場脈動.../index.html` | 命中 1 筆 | 命中，exit 0 |
| 6 | `rg og:url domain.com/blog/ dist/index.html` | 命中 1 筆 | 命中，exit 0 |
| 7 | `rg og:url domain.com/blog/posts/... dist/posts/成交文案.../index.html` | 命中 1 筆 | 命中，exit 0 |
| 8 | `curl file://.../dist/robots.txt` | 含 `Sitemap: https://domain.com/blog/sitemap-index.xml` | 符合，exit 0 |
| 9 | `curl file://.../dist/sitemap-index.xml` | 指向 `domain.com/blog/sitemap-0.xml` | 符合，實測 `https://domain.com/blog/sitemap-0.xml`, exit 0 |
| 10 | `curl file://.../dist/sitemap-0.xml \| rg domain.com/blog/` | 至少命中 1 筆 | 命中多筆，exit 0 |
| 11 | `curl file://.../dist/sitemap-0.xml \| rg 草稿` | 不命中（draft 排除） | 不命中，exit 1（符合預期） |
| 12 | `rg 'href=\"/(?!blog/)' dist/**/*.html` | 不命中（無破損 root-relative 連結） | 不命中，exit 1（符合預期） |
| 13 | `rg 'Sitemap: https://domain.com/blog/sitemap-index.xml' dist/robots.txt` | 命中 1 筆 | 命中，exit 0 |
| 14 | `rg '<loc>https://domain.com/blog/posts/' dist/sitemap-0.xml` | 命中多筆 | 命中 3 筆，exit 0 |
| 15 | `test -f dist/posts/市場脈動-2026第一季/index.html` | 存在 | `OK`, exit 0 |
| 16 | `test -f dist/posts/成交文案-五個技巧/index.html` | 存在 | `OK`, exit 0 |
| 17 | `test -f dist/posts/房仲社群經營-入門/index.html` | 存在 | `OK`, exit 0 |
| 18 | `curl -I https://domain.com/blog/` | 301/200 合理回應 | `301 -> https://www.domain.com/blog/`, exit 0 |

## pages.dev 301 證據

- 命令：`curl -I https://blog-origin.pages.dev/`
- 預期：`301 Location: https://domain.com/blog/...`
- 實測：`curl: (6) Could not resolve host: blog-origin.pages.dev`
- 判定：目前環境 DNS 不可用，需在 staging/正式網路重測。

## 後續修復建議

1. 在 staging/正式網路補跑 `pages.dev -> domain.com/blog/*` 301 驗證。
2. 將 smoke-test 納入 deploy 後 gate，失敗立即告警。
3. 於 Search Console 重新提交 `https://domain.com/blog/sitemap-index.xml`。

## 殘餘風險與監控建議

1. 殘餘風險：`pages.dev` 301 仍待 DNS 可用環境完成驗證。
2. 監控建議：
   - 每小時抓取 `/blog/sitemap-index.xml` 與 `/blog/robots.txt`，比對主機是否為 `domain.com`。
   - 每日抽測 3 篇文章 canonical/og:url。
   - 監控 `pages.dev` 301 成功率與 redirect chain 長度。
