# 開發維護指南

## 架構

網站使用 Vite 的多頁式建置，`base: './'` 讓產物使用相對資源路徑，支援 GitHub Pages 的專案子目錄。`vite.config.js` 自動將 `src/` 第一層所有 HTML 納入入口，因此新增頁面無需另外登錄。正式網址保持 `/<原檔名>.html`。

`public/` 的內容在開發時由網站根路徑提供，建置時原樣複製至 `dist/`。頁面來源的本地圖片與共用腳本使用 `/images/`、`/js/` 路徑，建置時由 Vite 改為相對路徑；共用樣式在 `src/styles/shared/`，由 Vite 與頁面樣式依原順序處理。JSON 仍由各頁透過 `fetch('data/…')` 讀取。

## 修改與驗證

1. 修改 `src/*.html`、`src/styles/` 或 `public/` 中的對應資源。
2. 執行 `npm run dev` 檢查頁面。
3. 執行 `npm run check`，確認 JSON 格式、JavaScript 語法、靜態本地連結與資料載入路徑。
4. 執行 `npm run build`、`npm run check:dist` 和 `npm test`。
5. 部署 `dist/`。勿編輯或提交建置產物。

檢查工具不會驗證外部票券網址、遠端 API 可用性或所有動態產生的路徑。瀏覽器測試會阻擋外部請求，重點在本地頁面、JSON、資源與操作回歸。

## 首頁拆分

- `src/index.html`：頁面結構及原有事件屬性。
- `src/styles/home/index.css`：依原始順序匯入首頁、共用及頁尾樣式。
- `src/styles/home/main.css`：首頁主要樣式。
- `src/styles/home/footer.css`：頁尾樣式。
- `public/js/pages/home/main.js`：原首頁控制邏輯與資料初始化。
- `public/js/pages/home/outbound-links.js`：外連語系處理。

目前保留 classic script，確保 HTML 事件與跨腳本全域變數正常存取。請勿直接加上 `type="module"`，否則原有 `onclick` 將找不到函式。後續應先將事件改成 `addEventListener`，再按資料讀取、篩選、收藏、導購等功能移到 `src/` 的 ES modules。

共用 `public/js/tabi_core.js`、既有主題頁內嵌程式與樣式亦尚待逐步拆分，這次主要建立單一來源與可驗證的建置流程。

## 歷史檔案

重整以舊 `app/` 正式發佈來源為基準。根目錄有差異的 HTML 保存在 `legacy/root-preview/`；相同的副本已合併。舊生成器與預覽工具在 `legacy/tools/`，不再作為新版建置方式。

雪況工具只更新 `public/data/snow_today.json`。`.github/workflows/deploy-pages.yml` 負責 `main` 推送、每日排程及手動發佈；排程會在同一輪更新、提交、建置與部署，避免機器人提交不觸發其他 workflow 的限制。

`ci.yml` 負責所有分支及 PR 的檢查；只有 `main` 會透過 Pages 流程發佈。`tests/serve-site.mjs` 在測試中模擬嚴格靜態託管，不會對不存在的資源回傳首頁；Playwright 分別測試 `/` 與 `/jp_report/`，用來抓出子目錄下的錯誤絕對路徑。

Actions 自動提交雪況需要 repository contents 寫入權限，Pages 發佈使用 pages 與 OIDC 權限，皆已在 workflow 按工作設定。若分支保護拒絕機器人提交，需依儲存庫規則允許此資料更新；目前流程不會繞過分支保護。
