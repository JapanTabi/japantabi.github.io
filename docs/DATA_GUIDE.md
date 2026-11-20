# 網站資料維護指南

網站內容統一放在 `public/data/`，頁面透過 `fetch()` 載入。Vite 開發時提供 `/data/` 路徑，建置時複製到 `dist/data/`；每份資料只需維護一次。

## 檔案對照

| 頁面 | JSON 檔案 | 資料結構與主要欄位 |
| --- | --- | --- |
| `index.html` | `spots.json` | 景點陣列；`id`、`theme`、`category`、`region`、`title`、`desc`、`img`、`klookUrl`、`bookingUrl` |
| `index.html` | `trains_database.json` | 首頁列車陣列；`id`、`name`、`route_category`、`section`、`image`、`ticket_url` |
| `index.html` | `community_feeds.json` | 旅人現場情報陣列；`id`、`season`、`user`、`spot`、`comment`、`img` |
| `index.html` | `hubs.json` | 首頁主分類物件；分類鍵對應 `title`、`themeMode`、`feedSeason`、`subItems` |
| `index.html` | `season_upload_config.json` | 各季節投稿表單設定；`modalTitle`、`spots`、`statuses`、`defaultComment` |
| `index.html` | `season_filters_config.json` | 各季節篩選選項；`regionLbl`、`regions`、`catLbl`、`categories` |
| `index.html` | `spot_geo_coords.json` | 景點座標陣列；`title`、`lat`、`lng` |
| `index.html` | `i18n.json` | 首頁語系物件；語言代碼如 `zh-TW`、`en`，每種語言含 `brandTitle`、`tab_spots`、`feedTitle` 等文字鍵 |
| `japan_train_tour.html` | `trains.json` | 列車頁陣列；`id`、`name`、`route_category`、`highlights`、`stations`、`itinerary`、`ticket_url` |
| `japan_charter_rental.html` | `charter.json` | 包車分類物件；分類鍵下有 `name` 與 `trips`，每筆行程含 `title`、`city`、`route`、`url` |
| `japan_inbound_rankings.html` | `rankings.json` | 排行分類物件；分類鍵下有 `title`、`icon`、`desc`、`items` |
| `japan_okinawa_drive.html` | `okinawa_spots.json`、`okinawa_itinerary.json` | 沖繩景點陣列（`id`、`tier1`、`subCat`、`name`、`mapUrl` 等）；行程物件（`family`、`senior`、`dive`、`shopping`） |
| `japan_ski_resorts.html` | `ski_resorts_list.json`、`resorts.json`、`snow_today.json` | 雪場清單陣列（`id`、`region`、`name`、`snow` 等）；以雪場 `id` 為鍵的票券與飯店詳情；每日雪況摘要 |
| `japan_theme_parks.html` | `theme_parks.json`、`theme_park_tickets.json` | 樂園陣列（`id`、`rank`、`name`、`region`、`img` 等）；以樂園 `id` 為鍵的門票網址 |
| `japan_flight_deals.html` | `airport_magazine_data.json`、`airport_details.json`、`airport_lounges.json`、`airport_transit_guides.json`、`airport_editorial_gallery.json`、`all_airports_gallery_db.json`、`routes_data.json` | 機場地區與機場列表、以機場代碼（如 `NRT`）為鍵的詳細資料，以及出發地航線清單 |
| `japan_special_edition.html` | `special_edition_articles.json`、`fuji_translations.json` | 以語言代碼（如 `zh-tw`、`en`）為鍵的專欄與富士主題文字 |
| `japan_special_edition_fuji.html` | `fuji_page_translations.json` | 富士專頁多語文字；`title`、`quote`、`histPre`、`histTitle`、`histP1`、`histP2` |

`trains.json` 與 `trains_database.json` 分別供列車頁與首頁使用，兩份目前各有 51 筆，但內容不完全相同；修改列車時請檢查兩頁是否都需要更新。`locations.json` 與 `seed_data.js` 屬於原有資料來源，不是上述頁面目前使用的 JSON。

## 編輯與預覽

1. 編輯 `public/data/` 內對應 JSON，保持原有欄位名稱、`id` 與結構。`theme_park_tickets.json` 的鍵要對應 `theme_parks.json` 的 `id`；`resorts.json` 的鍵要對應 `ski_resorts_list.json` 的 `id`。
2. 執行 `npm run dev` 預覽，無需複製資料。
3. 執行 `npm run check` 檢查 JSON、JavaScript 語法與頁面本地資源路徑。
4. 執行 `npm run build` 與 `npm run check:dist`，部署產出的 `dist/`。

`scripts/update_snow.py` 與 GitHub Actions 只更新 `public/data/snow_today.json`。資料是氣象模型估計，並非雪場官方實測。GitHub Pages 排程會在同一輪更新資料後重新建置、測試並發佈，才會反映在正式網站。

若未來將資料移到外部 API，需調整頁面 `fetch()` 路徑，並處理跨網域存取及載入失敗。
