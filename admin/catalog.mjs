const groups = {
  '景點與活動': {
    spots: '首頁景點', community_feeds: '旅人情報', spot_geo_coords: '景點座標',
    theme_parks: '遊樂園', theme_park_tickets: '樂園門票連結',
    ski_resorts_list: '滑雪場清單', resorts: '雪場票券與飯店', snow_today: '每日雪況',
    hot_springs: '溫泉名湯', festivals: '花火與祭典',
  },
  '交通與行程': {
    trains: '觀光列車專頁', trains_database: '首頁觀光列車', charter: '包車行程',
    okinawa_spots: '沖繩景點', okinawa_itinerary: '沖繩行程', rankings: '旅遊排行榜',
  },
  '機場與航線': {
    airport_magazine_data: '機場主資料', airport_details: '機場詳細資訊',
    airport_lounges: '機場貴賓室', airport_transit_guides: '機場交通指南',
    airport_editorial_gallery: '機場精選圖文', all_airports_gallery_db: '機場圖庫', routes_data: '航線資訊',
  },
  '語系與網站設定': {
    ui_translations: '全站共用介面（九語）',
    home_showcase_translations: '首頁溫泉與祭典（九語）',
    spot_translations: '景點內容譯文（九語）',
    i18n: '首頁多語文字', special_edition_articles: '主題專欄多語內容',
    fuji_translations: '富士專欄多語內容', fuji_page_translations: '富士專頁多語內容',
    hubs: '首頁主分類', season_filters_config: '季節篩選選項', season_upload_config: '季節投稿設定',
  },
  '歷史資料': { locations: '舊版景點資料' },
};

export function describeFile(file) {
  const key = file.replace(/\.json$/, '');
  let order = 0;
  for (const [group, items] of Object.entries(groups)) {
    for (const [name, title] of Object.entries(items)) {
      if (name === key) return { title, group, order };
      order++;
    }
  }
  return { title: key, group: '其他資料', order: 999 };
}

export const notes = {
  'spots.json': '部分既有景點 ID 重複。編輯時請確認選中的資料；新增時請使用不同 ID。',
  'trains.json': '列車專頁與首頁使用不同資料檔。需要同步顯示時，也請更新「首頁觀光列車」。',
  'trains_database.json': '這份資料供首頁使用；列車專頁另讀取 trains.json。',
  'theme_parks.json': 'id 與「樂園門票連結」互相對應，調整 id 時請一併檢查。',
  'ski_resorts_list.json': 'id 與「雪場票券與飯店」互相對應，調整 id 時請一併檢查。',
  'snow_today.json': '每日排程會覆寫這份資料，手動修改只會保留到下次自動更新。',
  'home_showcase_translations.json': '依來源資料 ID 對應九語卡片文字。修改來源內容時，請同步更新繁中原文與各語言譯文；圖片、排名、日期代碼及訂購連結仍由來源資料提供。',
  'locations.json': '這是歷史資料，目前正式頁面沒有讀取。',
};
