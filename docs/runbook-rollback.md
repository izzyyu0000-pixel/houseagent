# Runbook: Rollback Procedures

Date: 2026-03-01
Audience: 值班工程師、營運 on-call

## 1) Worker route 停用回滾

### 觸發條件
- `/blog` 全面 4xx/5xx
- 非 `/blog` 路由被誤影響
- origin proxy 異常造成內容不可達

### 操作步驟
1. Cloudflare Dashboard -> Workers Routes。
2. 停用或刪除 `domain.com/blog*` route。
3. 保留 Worker 程式碼，不立即刪除（便於事後分析）。
4. Purge cache：`/blog/*`。

Wrangler 參考：
```bash
wrangler routes delete domain.com/blog* --zone-name domain.com
```

### 問題 -> 影響 -> 修復 -> 驗證
| 問題 | 影響 | 修復 | 驗證 |
|---|---|---|---|
| Worker route 配錯或程式錯誤 | blog 路徑不可用或錯誤內容 | 停用 route，回到既有路徑處理 | `curl -I https://domain.com/blog/` 狀態恢復為既有行為 |
| Worker 誤綁非 `/blog` 路徑 | 主站被影響 | 刪除廣域 route，僅保留 `/blog*` | `curl -I https://domain.com/` 與 baseline 一致 |

## 2) Redirect 停用回滾（pages.dev）

### 觸發條件
- pages.dev 301 錯向
- 出現 redirect loop
- 無法到達 `domain.com/blog/*`

### 操作步驟
1. Cloudflare -> Rules -> Bulk Redirects。
2. 停用規則：`*.pages.dev/* -> https://domain.com/blog/$1`。
3. 若仍異常，清除該規則集快取並回復上一版規則。

### 問題 -> 影響 -> 修復 -> 驗證
| 問題 | 影響 | 修復 | 驗證 |
|---|---|---|---|
| pages.dev 未導回主網域 | SEO 分裂 | 啟用正確 Bulk Redirect | `curl -I https://<sub>.pages.dev/` 應為 301 到 `/blog/` |
| redirect loop | 無法開啟頁面 | 暫停 redirect 規則，修正 target | `curl -L -w '%{num_redirects}'` 不超過預期 |

## 3) CI/CD 回滾

### 觸發條件
- 新流程導致持續部署失敗
- 同步改動造成雙 workflow 異常

### 操作步驟
1. 在 GitHub Actions 停用失敗 workflow（短期）。
2. 回退 `.github/workflows/site-deploy.yml` / `blog-deploy.yml` 到上一個穩定 commit。
3. 以 `workflow_dispatch` 驗證一輪後再恢復 push 觸發。

### 問題 -> 影響 -> 修復 -> 驗證
| 問題 | 影響 | 修復 | 驗證 |
|---|---|---|---|
| path filter 設錯 | 錯誤觸發或漏觸發 | 回退 workflow 檔，重新套用已驗證規則 | 變更矩陣模擬結果正確 |
| deploy step 無法穩定成功 | 版本無法發布 | 使用重試 + 明確錯誤摘要，必要時 rollback | Actions log 顯示成功或可讀失敗原因 |

## 4) 一鍵回滾順序（建議）

1. 先停 Worker route（最快止血）。
2. 再停 Bulk Redirect（避免 loop/SEO 汙染）。
3. 最後回退 CI workflow 到上一穩定版。

## 5) 最小驗證清單（回滾後）

1. `curl -I https://domain.com/`
2. `curl -I https://domain.com/blog/`
3. `curl -I https://<sub>.pages.dev/`
4. 檢查 Cloudflare events 與 Actions 最新 run 狀態。
