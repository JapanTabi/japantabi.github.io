# 日本旅遊報報 JAPAN TABI

日本自由行攻略與聯盟導購網站，包含四季景點、滑雪、觀光列車、沖繩自駕、樂園、機場與主題特刊。

採用 **Vite 多頁式網站（MPA）＋原生 JavaScript＋JSON**。頁面保留原有 `.html` 網址，部署為靜態網站。

## 開始開發

建議使用 Node.js 24 LTS（版本記錄於 `.nvmrc`）。

```bash
npm ci
npm run dev
```

開啟終端顯示的網址，預設為 `http://127.0.0.1:5173/`。需使用 HTTP 伺服器，請勿以 `file://` 開啟頁面。

## 本機管理後台

執行 `npm run admin`，開啟 **http://127.0.0.1:4175/**，即可管理 `public/data/` 的 29 份 JSON，支援搜尋、表單／JSON 編輯、新增、複製、刪除與備份還原。

儲存會寫入本機資料檔；推送至 `main` 並部署成功後才會更新正式網站。管理後台獨立運作，不會發佈到 GitHub Pages。完整操作見 [管理後台指南](docs/ADMIN_GUIDE.md)。

## 專案結構

```text
src/                    HTML 頁面來源，首頁為 index.html
  styles/home/          首頁樣式
  styles/shared/        共用樣式
public/                 原樣複製到網站根目錄的資源
  data/                 唯一的旅遊 JSON 資料來源
  images/               圖片
  css/                  舊版相容樣式
  js/                   現有共用與相容腳本
    pages/home/         從首頁拆出的頁面邏輯
scripts/                資料維護與檢查工具
admin/                  本機資料管理介面與儲存服務
tests/                  網站與後台測試
config/                 聯盟設定範本
backend_scrapers/       舊氣象查詢示範，未接入網站更新
database/              預留 Supabase SQL，未接入目前頁面
docs/                  目前維護文件
legacy/                舊版工具、文件與有差異的預覽頁，不參與建置
dist/                  建置產物（不提交 Git）
```

現有腳本保留 classic script 的執行順序及全域函式，支援頁面既有的 `onclick`。`public/js/` 暫不由 Vite 打包；後續可按功能逐步轉為 ES modules。

## 指令與部署

| 指令 | 用途 |
| --- | --- |
| `npm run dev` | 本地開發與自動更新 |
| `npm run admin` | 本機內容管理後台 |
| `npm run test:admin` | 後台儲存、備份、衝突與瀏覽器測試 |
| `npm run check` | 檢查 JSON、腳本語法、本地連結與資料路徑 |
| `npm run build` | 建置全部 HTML 頁面到 `dist/` |
| `npm run check:dist` | 檢查建置後的資源與頁面 |
| `npm run preview` | 預覽正式建置結果 |
| `npm test` | Chromium 瀏覽器測試，先執行 build |

### GitHub Pages（目前採用）

1. 將這次完整修改提交到 `main`，包含 `src/`、`public/`、套件鎖定檔及 `.github/workflows/`；不用上傳 `dist/` 或 `node_modules/`。目前工作分支若為 `dev_nanami`，先推送該分支並將 PR 合併到 `main`。
2. GitHub 專案 → **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
3. 到 **Actions → Deploy GitHub Pages** 查看結果。成功後網址為 <https://qn5566.github.io/jp_report/>。

`main` 每次推送會自動檢查、建置、測試並部署；其他分支的推送不會覆蓋正式網站。若推送時尚未啟用 Pages，先完成步驟 2，再到部署流程按 **Run workflow**，選擇 `main` 重跑。

網站使用相對資源路徑，同一份建置支援網域根目錄及 `/jp_report/` 子目錄。

### 每日資料更新

`Deploy GitHub Pages` 每天 UTC 21:00（日本 06:00、台灣 05:00）先抓取雪況、提交 JSON，再以最新資料建置並發佈；GitHub 排程可能延遲。也可在 **Run workflow** 勾選「更新雪況後再發佈」。

排程與部署放在同一個流程，因為 GitHub Actions 機器人使用內建 token 提交的 commit 不會觸發另一輪 push workflow。資料更新失敗時流程會停止，保留現有線上網站。

### 其他靜態平台

Cloudflare Pages、Vercel 或 Netlify 也可使用 `npm run build`，發佈目錄 **`dist`**，專案根目錄設為儲存庫根目錄。

首次執行瀏覽器測試需執行 `npx playwright install chromium`。GitHub Actions 會檢查來源、建置、檢查產物並執行瀏覽器測試。測試同時驗證根目錄及 GitHub Pages 子目錄。

## 資料與整合現況

- 編輯內容請直接修改 `public/data/`，不需同步另一份資料。
- 每日雪況排程於日本時間 06:00 執行，來源為 Open-Meteo 模型估計。排程是否成功需查看 Actions。
- 花況與旅人情報主要為靜態內容；投稿尚未接上伺服器儲存。
- 收藏與語系偏好儲存在瀏覽器；Supabase、Gemini 尚未串接。
- Klook 與 Trip.com 導購參數仍分布於頁面、腳本與資料；`config/affiliate.json` 並非所有連結的唯一設定來源。
- manifest 提供應用程式描述，尚未建立 Service Worker 離線快取。

維護方式見 [開發指南](docs/DEVELOPER_GUIDE.md)、[資料指南](docs/DATA_GUIDE.md) 與 [外部服務整合](docs/API_INTEGRATION_GUIDE.md)。
