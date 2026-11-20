# 外部服務整合現況

## 已有實作

- `scripts/update_snow.py`：使用 Python 標準函式庫向 Open-Meteo 查詢四個座標的當日降雪、積雪與日照，輸出 `public/data/snow_today.json`。積雪是模型估計；日降雪為當日預報合計，並非滾動過去 24 小時的觀測值。
- `.github/workflows/deploy-pages.yml`：每日 UTC 21:00（日本 06:00、台灣 05:00）更新並提交資料，接續建置、測試與發佈 GitHub Pages；可手動勾選更新雪況。
- 機場頁面另有外部匯率請求；網路或服務失敗時需檢查瀏覽器主控台。
- Klook、Trip.com 導購使用外部連結，沒有在本站處理付款。

## 尚未接通

`backend_scrapers/run_pipeline.py` 為舊氣象查詢示範，只印出結果，沒有將花況、煙火或雪況寫回目前網站。`database/schema.sql` 與 `.env.example` 中的 Supabase、Gemini 設定屬於預留，無法只填入金鑰就啟用。

`public/` 會原樣對外公開。請勿把金鑰、`.env`、服務帳號或 Supabase service role key 放在裡面；需要機密的 API 應由伺服器或排程呼叫。

原 API 研究文件保存在 `legacy/docs/API_INTEGRATION_GUIDE.md`，其中端點、選擇器與示例尚未驗證，不應視為已完成串接的依據。
