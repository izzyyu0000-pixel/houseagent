# Release Checklist (Site + Blog)

Date: 2026-03-01
Audience: 營運、工程、SRE

## 上線前檢查

| 項目 | 檢查內容 | 問題 | 影響 | 修復 | 驗證 |
|---|---|---|---|---|---|
| RC-01 | 主站 CI 僅處理非 `blog/**` 變更 | Workflow path filter 配錯 | 主站被 blog 變更誤觸發 | 檢查 `.github/workflows/site-deploy.yml` paths 規則 | 模擬變更矩陣（site/blog/docs） |
| RC-02 | Blog CI 僅處理 `blog/**` 變更 | Blog workflow 觸發範圍過大 | docs/infra 變更誤部署 blog | 檢查 `.github/workflows/blog-deploy.yml` paths 規則 | 模擬變更矩陣 |
| RC-03 | Firebase deploy secrets 可用 | `FIREBASE_TOKEN` 缺失 | 主站無法部署 | 補齊 GitHub Encrypted Secrets | 手動執行 workflow_dispatch |
| RC-04 | Cloudflare Pages deploy secrets 可用 | `CF_API_TOKEN`/`CF_ACCOUNT_ID` 缺失 | Blog 無法部署 | 補齊 secrets，驗證權限 | 手動執行 workflow_dispatch |
| RC-05 | Blog build 成功 | build 失敗 | sitemap/頁面不更新 | 修復 build 錯誤再部署 | `ASTRO_TELEMETRY_DISABLED=1 npm run build` |
| RC-06 | canonical/og:url 指向主網域 | `astro.config.mjs` `site` 非 `domain.com` | SEO 分裂，索引混亂 | 將 `site` 改為 `https://domain.com` 並重建 | 抽測 HTML canonical/og:url |
| RC-07 | sitemap 與 robots 一致 | sitemap 主機與 robots 不一致 | 搜尋引擎訊號衝突 | 修正 `site` 後重建，必要時 purge cache | grep 檢查 `sitemap-0.xml` 與 `robots.txt` |
| RC-08 | Worker route 僅綁 `domain.com/blog*` | route 綁太廣 | 非 blog 路由被影響 | 只綁 `/blog*`，不得綁 `domain.com/*` | curl 非 `/blog` 路由 |
| RC-09 | Bulk Redirect 僅 `*.pages.dev/* -> domain.com/blog/*` | redirect 錯向或重複 | loop/SEO 汙染 | 停用錯誤規則，改正 source/target | curl `pages.dev` / `domain.com/blog` |
| RC-10 | smoke-test 腳本可執行 | 腳本中斷或判斷錯誤 | 上線檢查失真 | 修正腳本後納入 release gate | `scripts/smoke-test.sh` |

## 上線後 24 小時檢查

| 項目 | 檢查內容 | 問題 | 影響 | 修復 | 驗證 |
|---|---|---|---|---|---|
| D24-01 | 5xx/4xx 比例（blog 路徑） | 5xx 突增 | 服務不可用、SEO 下滑 | 回滾 Worker route 或部署前版 | Cloudflare Analytics / Logpush |
| D24-02 | `domain.com/blog/*` 200/301 正常 | 異常 403/404 | 使用者不可達 | 檢查 WAF challenge、origin health | curl 抽測 + Cloudflare Firewall events |
| D24-03 | sitemap 可抓取 | sitemap 404/錯網域 | 索引延遲 | 修正 build 輸出並重新部署 | curl sitemap + Search Console |
| D24-04 | pages.dev 是否 301 到主網域 | 未 301 或 DNS 失敗 | SEO 分裂 | 修正 Bulk Redirect 與 DNS | curl `-I https://<subdomain>.pages.dev/` |
| D24-05 | CI 失敗率與重試命中率 | 重試仍失敗 | 持續無法發布 | 檢查 secrets/token/權限 | GitHub Actions run history |
| D24-06 | 內容頁 canonical 正確 | 指向錯誤網域 | 重複索引 | 修正 `site` + 重建 + purge | 抽測 3 頁 canonical |

## 殘餘風險與監控建議

1. 目前 SEO 最大風險：`pages.dev` 301 匯流尚未在可用 DNS 環境完成最終驗證。
2. 建議監控：
   - Cloudflare: `domain.com/blog*` 5xx rate、Firewall challenge rate。
   - GitHub Actions: deploy job failure rate、retry 次數。
   - SEO: Search Console 索引覆蓋率、canonical 違規數。
