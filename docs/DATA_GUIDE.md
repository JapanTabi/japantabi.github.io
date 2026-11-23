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

可以執行 `npm run admin`，以表單管理以下資料。詳見 [本機後台指南](ADMIN_GUIDE.md)。

1. 編輯 `public/data/` 內對應 JSON，保持原有欄位名稱、`id` 與結構。`theme_park_tickets.json` 的鍵要對應 `theme_parks.json` 的 `id`；`resorts.json` 的鍵要對應 `ski_resorts_list.json` 的 `id`。
2. 執行 `npm run dev` 預覽，無需複製資料。
3. 執行 `npm run check` 檢查 JSON、JavaScript 語法與頁面本地資源路徑。
4. 執行 `npm run build` 與 `npm run check:dist`，部署產出的 `dist/`。

`scripts/update_snow.py` 與 GitHub Actions 只更新 `public/data/snow_today.json`。資料是氣象模型估計，並非雪場官方實測。GitHub Pages 排程會在同一輪更新資料後重新建置、測試並發佈，才會反映在正式網站。

若未來將資料移到外部 API，需調整頁面 `fetch()` 路徑，並處理跨網域存取及載入失敗。

## 共用介面的九語翻譯

`public/data/ui_translations.json` 是共用導覽、頁尾、文章庫介面，以及首頁匯率／天氣標籤的主要翻譯來源。使用 `zh-TW`、`zh-CN`、`en`、`ja`、`ko`、`th`、`vi`、`hi`、`es` 九個語言鍵；每語必須包含相同的文字鍵與參數。

- HTML 使用 `data-i18n="nav.flights"` 標記只含文字的元素。請勿把此標記放在包含圖示、連結或其他子元件的容器上，因為更新文字會替換其內容。
- 屬性使用 `data-i18n-title`、`data-i18n-aria-label`、`data-i18n-alt`、`data-i18n-placeholder` 或 `data-i18n-content`。
- 動態文字使用 `TabiLang.t('weather.rain', { pop: '20%' })`；所有語言須保留同樣的 `{pop}` 參數。
- `TabiLang.ready` 在字典載入後完成；`TabiLang.onChange(render)` 會在字典就緒及使用者切換時重新顯示目前語言。避免保存第一次載入時的語言供後續請求使用。
- 字典無法載入時保留來源文字；`html[data-i18n-state="fallback"]` 表示使用備援。這不代表所選語言的翻譯已完成。
- `npm run check` 與 `npm run check:dist` 會檢查九語缺鍵、空值、參數不一致，以及 HTML 使用了不存在的翻譯鍵。
- `i18n.json` 暫時仍供首頁既有局部文字使用，三份專欄字典仍供長篇內容使用；它們不代表整頁已完成翻譯。

本機後台的「語系與網站設定 → 全站共用介面（九語）」可編輯這份資料。天氣只請求一次，切換語言會使用已載入資料重繪城市名稱與提示；氣象廳原始日文預報仍保留於滑鼠提示中。

首頁的季節與篩選介面使用 `home.season.*`、`home.sub.*`、`home.feature.*`、`home.region.*` 鍵。畫面翻譯後仍以原本的 `item.id`、`item.val`、`data-region` 及特色代碼判斷條件，請勿把這些值改為譯文。新增的動態 HTML 可在建立後呼叫 `TabiLang.render(container)`，只更新容器內標記的文字及屬性；涉及數量或季節的完整句子，請以 `TabiLang.t(key, params)` 取得文字後指定 `textContent`。

## 首頁溫泉與祭典卡片內容

`public/data/home_showcase_translations.json` 依「語言 → 資料種類 → 來源 ID → 欄位」管理卡片譯文。資料種類為 `hot_springs` 與 `festivals`，對應原本的同名 JSON。原始資料仍提供圖片、排名、日文正式名稱、地區及訂購關鍵字，畫面不會用譯文覆寫它們。

- 溫泉卡片翻譯 `name`、`spring_quality`、`highlights`、`day_trip`。
- 祭典卡片翻譯 `name`、`date_display`、`shots`、`badge`、`highlights`、`reserved_seats`、`transit`；`badge` 對應來源 `scale` 在第一個「・」之前的顯示標籤。
- 九語必須包含相同的來源 ID 與上述欄位。`zh-TW` 保存來源文字快照；修改原文時須同步更新譯文與快照。檢查程式會拒絕漏欄位、空值、多餘 ID、未知欄位或已變動的來源快照，避免悄悄沿用過時譯文。
- 都道府縣名稱與卡片操作標籤放在 `ui_translations.json` 的 `pref.*`、`showcase.*`。新增來源地區時，亦須在 `showcases.js` 的來源地區對應表與共用字典中補齊。
- `showcases.js` 只請求一次兩份來源和譯文，語言切換使用快取重繪並保留橫向位置。單一卡片譯文不完整時顯示完整原文，區塊另顯示原文提示；一個資料來源載入失敗不會阻止另一區塊顯示。
- 卡片只顯示上述欄位；來源中尚未顯示的療效、其他特色、觀賞地點等欄位仍未納入這批翻譯。這批沿用現有內容與時程，不表示重新查核活動或浴場營業資訊。

本機後台可從「景點與活動」編輯來源，從「語系與網站設定 → 首頁溫泉與祭典（九語）」編輯譯文。

## 景點主要文字與收藏翻譯

`spot_translations.json` 的 `entries` 每筆包含 `source` 與 `translations`。`source` 記錄原始 `id`、`theme`、`region`，以及 `fields` 中的原文字串快照；`translations` 使用九個標準語言代碼。巢狀欄位以 `sakuraCafe.name`、`sakuraCafe.feature` 表示。

目前收錄二十一筆夜櫻卡片的主要文字，每語共 200 個欄位。範圍包括弘前、高田、上野、大阪城、姬路城、名古屋城、熊本城、松本城、小田原城、岡崎公園、郡山城跡、高遠城址公園、鶴之城、松山城、高知城、舞鶴公園、目黑川、千鳥之淵、六義園、隅田公園與毛利庭園。

新增譯文時，先完整保存該筆原文快照，再填齊九語；`npm run check` 會檢查來源是否吻合、必要欄位、未知欄位、缺譯與原文快照。目前 ID 已唯一；仍須核對來源快照與舊身分對應，避免把過時內容套到變動後的景點。

`spot_i18n.js` 以來源物件比對後更新顯示用的文字節點、圖片替代文字和提示，不修改事件參數、連結、篩選值或原始資料。尚未翻譯或來源變動時保留原文。卡片的通用操作文字放在 `ui_translations.json` 的 `spotUI.*`；收藏介面與匯出標籤放在 `favorites.*`。

收藏使用來源的 ID、標題與地區辨識，不再只靠 ID。既有快照維持原內容；顯示與匯出時，只有能明確對應的項目才套用目前語言的譯文。無法確認的舊收藏保留原文，避免猜測或覆寫使用者資料。共享的匯出流程仍保留來源網址、MapCode、交通與提示資訊。

## 全站文字字典與靜態語言頁

`public/data/site_i18n/source.json` 保存來源文字與出處，`index.json` 是瀏覽器載入的精簡索引，其他八份語言 JSON 保存譯文。這層補齊全部前台內容，`spot_translations.json` 的二十一筆仍是優先保留的編輯譯文，不代表全站只翻譯二十一個景點。

維護流程：

```sh
npm run i18n:extract
npm run i18n:translate
node scripts/i18n/manifests.mjs
npm run check:i18n
npm run check
npm run build
npm run check:dist
npm test
```

產生器僅處理專案既有公開文案，使用開發端的批量翻譯介面，支援中斷續跑。`--refresh-terms` 可重新產生服務語言、坪數與飛行時長相關文字。字典應提交到版本控制，部署與旅客瀏覽時不依賴翻譯服務。機器初稿的母語校對狀態與數字差異見 `I18N_AUDIT.md` 及 `docs/i18n/numeric-review.json`。

`npm run build` 產生根目錄頁面及 `zh-TW/`、`zh-CN/`、`en/`、`ja/`、`ko/`、`th/`、`vi/`、`hi/`、`es/` 各十四頁。靜態頁含來源標記以支援切換語言，切勿移除 `data-tabi-source-*` 或 `tabi:` 註解。各頁以相對 base 取得原始資源，支援專案子路徑；安裝資訊位於 `data/site_i18n/manifests/`。

`TabiI18n.text(source)` 只產生目前語言的顯示文字；`TabiI18n.render()` 可安排重繪；`TabiI18n.ready` 表示目前字典載入完成。不要用譯文取代 ID、表單 value、來源 JSON、地圖查詢或儲存快照。新增使用者內容容器時，標記 `data-i18n-skip`；純粹的使用者輸入、留言與正式名稱須按產品用途保留原文。

## 2026-11-23 資料與翻譯查核更新

景點來源已由 580 筆整理為 **565 筆、565 個唯一 ID**。13 組同地點版本合併，札幌與京都圓山公園分配不同 ID；舊版本與處理紀錄在 `docs/data/spot-duplicate-resolution.json`。`spot_aliases.json` 保存 16 組舊身分對應，修改後須執行 `node scripts/i18n/build-spot-identity.mjs` 更新跨頁解析器。讀取／顯示舊收藏不改寫 localStorage，刪除依原始快照精確比對。上述內容取代前文「現有 ID 衝突」的描述。

花況標為季節參考，夜間時段標為歷年參考，`bloomReference` 保留篩選用途。不可把這些欄位顯示成即時百分比。官方資料查核範圍與限制見 `docs/data/OFFICIAL_REVIEW.md`。

`reviewed-glossary.json` 保存本次確認的地名與植物名稱。產生器保護數量、單位、專名與模板變數；遠端若遺失保護標記，退回逐段翻譯並原樣插入保護值，最終只有純文字。`--review-queue <JSON>` 可針對 `{language,id}` 陣列重新產生指定譯文，編輯字典仍優先。

數字檢查已改用語系格式、萬／億換算、折扣、時長、時刻、分數與泰國佛曆比較；不相符即使檢查失敗。原始 2,477 筆清單保存在 `docs/i18n/numeric-review-baseline.json`，逐筆結果在 `docs/i18n/numeric-resolutions.json`，現有未解項目在 `docs/i18n/numeric-review.json`。這是數字一致性檢查，不等同母語潤稿或所有商家資訊查核。

人工修訂特定長句時，將來源全文、語言與譯文放入 `scripts/i18n/reviewed-overrides.json`；只有來源仍存在才納入編輯記憶。變更後重新抽取、產生字典並執行檢查。
