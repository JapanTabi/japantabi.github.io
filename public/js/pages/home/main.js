

    function getHeartSvg(isActive, size) {
      size = size || 12;
      if (isActive) {
        return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
      }
      return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
    }
    // ===============================================================
    // 🎯 Trip.com 官方認證專屬分潤追蹤參數與短網址 (30 天 Cookie 歸因鎖定機制)
    // ===============================================================
    const TRIP_CONFIG = {
      shortUrl: "https://www.trip.com/t/fgyJcXow1X2",
      allianceId: "9507030",  // 個人/主分銷帳號
      sid: "325761227",       // 網站 ID (日旅報報官方渠道)
      tripSub1: "%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1",
      adId: "D20905663",       // Ad ID (專屬活動追蹤編號)
      token: "sl_fgyJcXow1X2"
    };

    const TRIP_AFFILIATE_QUERY = `Allianceid=${TRIP_CONFIG.allianceId}&SID=${TRIP_CONFIG.sid}&trip_sub1=${TRIP_CONFIG.tripSub1}&trip_sub3=${TRIP_CONFIG.adId}&linkhub_token=${TRIP_CONFIG.token}`;

    // 產生標準帶 30 天分潤歸因的台灣繁中站 Deep Link
    function buildTripUrl(path) {
      if (!path) return TRIP_CONFIG.shortUrl;
      if (path.startsWith('https://www.trip.com/t/')) return path;
      const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
      const tripDomainMap = {
        'en': 'https://www.trip.com',
        'th': 'https://th.trip.com',
        'ja': 'https://jp.trip.com',
        'ko': 'https://kr.trip.com',
        'zh-CN': 'https://hk.trip.com',
        'zh-TW': 'https://tw.trip.com'
      };
      const tripDomain = tripDomainMap[l] || 'https://tw.trip.com';
      let baseUrl = path.startsWith('http') ? path.replace(/https:\/\/[a-z0-9\-]+\.trip\.com/, tripDomain) : `${tripDomain}${path}`;
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}${TRIP_AFFILIATE_QUERY}`;
    }

    // 快速生成機票跳轉連結 (支援各航線直達深層連結)
    function buildTripFlightUrl(dest, fromCity) {
      const citySlugMap = {
        'taipei': { slug: 'taipei', code: 'tpe' },
        'kaohsiung': { slug: 'kaohsiung', code: 'khh' },
        'tokyo': { slug: 'tokyo', code: 'tyo' },
        'osaka': { slug: 'osaka', code: 'osa' },
        'sapporo': { slug: 'sapporo', code: 'spk' },
        'fukuoka': { slug: 'fukuoka', code: 'fuk' },
        'okinawa': { slug: 'okinawa', code: 'oka' },
        'nagoya': { slug: 'nagoya', code: 'ngo' },
        'sendai': { slug: 'sendai', code: 'sdj' }
      };
      const f = citySlugMap[(fromCity || 'taipei').toLowerCase()] || { slug: 'taipei', code: 'tpe' };
      const t = citySlugMap[(dest || 'tokyo').toLowerCase()] || { slug: 'tokyo', code: 'tyo' };
      return buildTripUrl(`/flights/${f.slug}-to-${t.slug}/tickets-${f.code}-${t.code}?locale=zh-TW&curr=TWD`);
    }

    const TRIP_HOTEL_CITY_MAP = {
      'tokyo': 'tokyo-hotels-list-294',
      '東京': 'tokyo-hotels-list-294',
      'osaka': 'osaka-hotels-list-219',
      '大阪': 'osaka-hotels-list-219',
      'kyoto': 'kyoto-hotels-list-734',
      '京都': 'kyoto-hotels-list-734',
      'okinawa': 'okinawa-hotels-list-614',
      '沖繩': 'okinawa-hotels-list-614',
      '那霸': 'okinawa-hotels-list-614',
      'sapporo': 'sapporo-hotels-list-704',
      '札幌': 'sapporo-hotels-list-704',
      '北海道': 'sapporo-hotels-list-704',
      'fukuoka': 'fukuoka-hotels-list-267',
      '福岡': 'fukuoka-hotels-list-267',
      '九州': 'fukuoka-hotels-list-267',
      '博多': 'fukuoka-hotels-list-267'
    };

    // 快速生成飯店訂房搜尋連結 (完整支援 redirect_url 與 30 天 Cookie 追蹤)
    function buildTripHotelUrl(cityName) {
      const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
      let c = (cityName || 'tokyo').toLowerCase();
      let cityPath = 'tokyo-hotels-list-294';
      for (const k in TRIP_HOTEL_CITY_MAP) {
        if (c.includes(k.toLowerCase())) {
          cityPath = TRIP_HOTEL_CITY_MAP[k];
          break;
        }
      }

      let domain = 'https://tw.trip.com';
      let sub1 = '%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1_%E4%BD%8F%E5%AE%BF';

      if (l === 'en') {
        domain = 'https://www.trip.com';
        sub1 = '%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1_EN_Hotel';
      } else if (l === 'ja') {
        domain = 'https://jp.trip.com';
        sub1 = '%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1_JP_Hotel';
      }

      const targetUrl = `${domain}/hotels/${cityPath}/`;
      return `${domain}/?Allianceid=9507030&SID=325761227&trip_sub1=${sub1}&trip_sub3=D20905663&redirect_url=${encodeURIComponent(targetUrl)}`;
    }

    // 快速生成新幹線車票購買連結
    function buildTripShinkansenUrl(routeQuery) {
      return buildTripUrl(`/trains/japan/?keyword=${encodeURIComponent(routeQuery || '')}`);
    }

    // 執行搜尋盒一鍵跳轉
    function executeTripSearch() {
      const from = document.getElementById('tripSearchFrom') ? document.getElementById('tripSearchFrom').value : 'taipei';
      const dest = document.getElementById('tripSearchDest') ? document.getElementById('tripSearchDest').value : 'tokyo';
      const type = document.getElementById('tripSearchType') ? document.getElementById('tripSearchType').value : 'flight';

      let targetUrl = '';
      if (type === 'flight') {
        targetUrl = buildTripFlightUrl(dest, from);
      } else if (type === 'hotel') {
        const destNameMap = {
          'tokyo': '東京', 'osaka': '大阪', 'fukuoka': '福岡', 'sapporo': '札幌',
          'okinawa': '沖繩', 'nagoya': '名古屋', 'sendai': '仙台', 'kumamoto': '熊本'
        };
        targetUrl = buildTripHotelUrl(destNameMap[dest] || dest);
      } else if (type === 'train') {
        const destTrainMap = {
          'tokyo': '東京', 'osaka': '新大阪', 'fukuoka': '博多', 'sapporo': '新函館北斗',
          'nagoya': '名古屋', 'sendai': '仙台', 'kumamoto': '熊本'
        };
        targetUrl = buildTripShinkansenUrl(destTrainMap[dest] || '新幹線');
      } else {
        targetUrl = buildTripUrl('/');
      }
      window.open(targetUrl, '_blank');
    }

    // 一鍵複製折扣碼並跳轉 Trip.com
    function copyTripCoupon(code, path) {
      navigator.clipboard.writeText(code).then(() => {
        alert(`🎉 折扣碼【${code}】已複製到剪貼簿！\n即將為您前往 Trip.com 自動啟用 30 天早鳥最低價保證！`);
        window.open(buildTripUrl(path || '/'), '_blank');
      }).catch(() => {
        window.open(buildTripUrl(path || '/'), '_blank');
      });
    }

    let currentLang = TabiLang.get();
    let I18N = {};

    function toggleLangDropdown(e) {
      if (e) e.stopPropagation();
      const wrap = document.getElementById('langSelectorWrap');
      if (wrap) wrap.classList.toggle('open');
    }


    // ========================================================
    // 多國貨幣匯率換算系統 (TWD, JPY, USD, HKD, KRW, THB)
    // ========================================================
    const CURRENCIES = {
      'TWD': { symbol: 'NT$', rate: 1, label: 'TWD (NT$)', flag: '🇹🇼' },
      'JPY': { symbol: '¥', rate: 4.75, label: 'JPY (¥)', flag: '🇯🇵' },
      'USD': { symbol: '$', rate: 0.031, label: 'USD ($)', flag: '🇺🇸' },
      'HKD': { symbol: 'HK$', rate: 0.24, label: 'HKD (HK$)', flag: '🇭🇰' },
      'KRW': { symbol: '₩', rate: 42.5, label: 'KRW (₩)', flag: '🇰🇷' },
      'THB': { symbol: '฿', rate: 1.12, label: 'THB (฿)', flag: '🇹🇭' }
    };

    let currentCurrency = localStorage.getItem('tabi_currency') || 'TWD';

    function formatCurrency(ntdAmount) {
      const cfg = CURRENCIES[currentCurrency] || CURRENCIES['TWD'];
      const converted = ntdAmount * cfg.rate;
      if (currentCurrency === 'USD') {
        return `${cfg.symbol} ${converted.toFixed(1)}`;
      }
      return `${cfg.symbol} ${Math.round(converted).toLocaleString()}`;
    }



    // 櫻花前線救援路線平滑切換
    function jumpToSpot(targetSpotId) {
      if (currentMasterHub !== 'flower') {
        selectMasterHub('flower');
      }
      setTimeout(() => {
        let card = document.getElementById(`spot-card-${targetSpotId}`);
        if (!card) {
          // 若當前子標籤過濾隱藏了該卡片，切換到第一個子分類
          currentSubItemId = 'sub_sakura_now';
          renderCards();
          card = document.getElementById(`spot-card-${targetSpotId}`);
        }
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.remove('rescue-target-highlight');
          void card.offsetWidth;
          card.classList.add('rescue-target-highlight');
          showToast('🌸 已為您無縫接力切換至晚開接棒名所！', '✨');
        } else {
          showToast('🌸 正在為您定位接力備案名所...', '✨');
        }
      }, 150);
    }

    // 周邊續攤三段式標籤切換 (景觀咖啡 / 頂級日料米其林 / 站內步行指引)
    function switchPerksTab(spotId, tabKey, btn) {
      const container = document.getElementById(`perks-${spotId}`);
      if (!container) return;

      container.querySelectorAll('.perks-tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      container.querySelectorAll('.perks-tab-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(`pane-${spotId}-${tabKey}`);
      if (targetPane) targetPane.classList.add('active');
    }


    function selectLanguage(langCode, langName) {
      const wrap = document.getElementById('langSelectorWrap');
      if (wrap) wrap.classList.remove('open');

      const label = document.getElementById('currentLangLabel');
      if (label) {
        label.textContent = langName;
      }

      document.querySelectorAll('.lang-menu-opt').forEach(opt => {
        const isThis = opt.getAttribute('data-lang') === langCode;
        opt.classList.toggle('active', isThis);
        const check = opt.querySelector('.lang-check');
        if (check) check.textContent = isThis ? '✓' : '';
      });

      setLanguage(langCode);
      showToast(`🌐 語言已切換為：${langName}`, '✨');
    }

    // 點擊空白處自動關閉語言選單
    document.addEventListener('click', function (e) {
      const wrap = document.getElementById('langSelectorWrap');
      if (wrap && !wrap.contains(e.target)) {
        wrap.classList.remove('open');
      }
    });

    function setLanguage(lang) {
      lang = TabiLang.normalize(lang) || TabiLang.get();
      if (lang !== TabiLang.get()) {
        TabiLang.set(lang);
        return;
      }
      currentLang = lang;

      const t = I18N[lang] || I18N['zh-TW'];
      if (!t) return;
      const brandTitleZh = document.getElementById('brandTitleZh');
      if (brandTitleZh) brandTitleZh.innerText = t.brandTitle;
      const brandTitleEn = document.getElementById('brandTitleEn');
      if (brandTitleEn) brandTitleEn.innerText = t.brandEn || 'JAPAN TABI';
      const brandTag = document.getElementById('brandTag');
      if (brandTag) brandTag.innerText = t.brandTag;

      const brandSub = document.getElementById('brandSub');
      if (brandSub) brandSub.innerText = t.brandSub;

      const tripBtnText = document.getElementById('tripBtnText');
      if (tripBtnText) tripBtnText.innerText = t.tripBtn;

      const feedTitleText = document.getElementById('feedTitleText');
      if (feedTitleText) feedTitleText.innerText = t.feedTitle;

      const uploadBtnText = document.getElementById('uploadBtnText');
      if (uploadBtnText) uploadBtnText.innerText = t.uploadBtn;

      document.querySelectorAll('.i18n-btn').forEach(el => {
        const key = el.getAttribute('data-key');
        if (key && t[key]) {
          el.innerText = t[key];
        }
      });

      TabiLang.refresh();

      renderCards();
      renderCommunityFeeds();
    }

    // 旅人即時四季現場情報投稿 (一週內實況)
    let COMMUNITY_FEEDS = [];

    // 22+ 景點資料庫
    // 24+ 全日本四季名所・官方觀測與特派員資料庫
    let SPOTS_DATABASE = [];

    let currentSeason = 'sakura';
    let currentRegion = 'all';
    let currentCategory = 'all';

    function renderCommunityFeeds() {
      const container = document.getElementById('communityFeedContainer');
      if (!container) return;
      container.innerHTML = '';

      // 更新實況看板標題、圖示與提示字樣，與當前季節精準連動
      const t = I18N[currentLang] || I18N['zh-TW'] || {};
      const iconEl = document.getElementById('feedTitleIcon');
      const titleEl = document.getElementById('feedTitleText');
      const hintEl = document.getElementById('feedSubHint');
      const btnEl = document.getElementById('uploadBtnText');

      const isSnowMode = (typeof currentMasterHub !== 'undefined' && currentMasterHub === 'snow') || currentSeason === 'snow';
      const feedSec = document.getElementById('communityFeedSection');

      if (isSnowMode) {
        if (iconEl) iconEl.innerText = '❄️';
        if (titleEl) titleEl.innerText = '雪季最前線：全日本雪場現場即時分享';
        if (feedSec) {
          feedSec.style.background = 'linear-gradient(135deg, #E0F2FE 0%, #EDE9FE 100%)';
          feedSec.style.borderColor = '#BAE6FD';
          feedSec.style.boxShadow = '0 6px 24px rgba(186, 230, 253, 0.35)';
        }
      } else if (currentSeason === 'momiji') {
        if (iconEl) iconEl.innerText = '🍁';
        if (titleEl) titleEl.innerText = '紅葉最前線：全日本秋季賞楓現場即時分享';
        if (feedSec) {
          feedSec.style.background = '';
          feedSec.style.borderColor = '';
          feedSec.style.boxShadow = '';
        }
      } else if (currentSeason === 'ginkgo') {
        if (iconEl) iconEl.innerText = '🍂';
        if (titleEl) titleEl.innerText = '銀杏最前線：全日本黃金銀杏現場即時分享';
        if (feedSec) {
          feedSec.style.background = '';
          feedSec.style.borderColor = '';
          feedSec.style.boxShadow = '';
        }
      } else {
        if (iconEl) iconEl.innerText = '🌸';
        if (titleEl) titleEl.innerText = '賞櫻最前線：全日本花季現場即時分享';
        if (feedSec) {
          feedSec.style.background = '';
          feedSec.style.borderColor = '';
          feedSec.style.boxShadow = '';
        }
      }

      const hintKey = 'feed_' + currentSeason + '_hint';
      const btnKey = 'feed_' + currentSeason + '_btn';
      if (hintEl && t && t[hintKey]) hintEl.innerText = t[hintKey];
      if (btnEl && t && t[btnKey]) btnEl.innerText = t[btnKey];

      // 依據當前季節過濾回報，全部景點顯示綜合推薦
      const filteredFeeds = COMMUNITY_FEEDS.filter(item => {
        if (currentSeason === 'spots') return true;
        return item.season === currentSeason;
      });

      filteredFeeds.forEach(item => {
        const card = document.createElement('div');
        card.className = 'feed-snap-card';
        // 抗疲勞極簡卡片呈現 (依和風櫻花低飽和色票規範)
        if (item.theme === 'sakura' || item.theme === 'flower') {
          card.innerHTML = `
            <div class="card-img-box">
              <img src="${item.img}" alt="${item.title}" loading="lazy">
              <button class="btn-card-fav ${isFav ? 'active' : ''}" data-fav-id="${item.id}" onclick="toggleFavorite('${item.id}', 'spot', '${item.title.replace(/'/g, "\\'")}', '${item.img}', '${item.region || ''}', '${item.tag || ''}'); event.stopPropagation();" title="${isFav ? '已在收藏本' : '加入我的行程收藏'}">
                ${getHeartSvg(isFav, 12)}
              </button>
              <div class="card-floating-badge">${item.tag}</div>
              <div class="card-bloom-status-tag">${item.bloomStatus || '🌸 滿開 (100%)'}</div>
            </div>
            <div class="card-body">
              <div class="card-title-header">
                <div>
                  <h3 style="margin:0; font-size:1.05rem; font-weight:900; color:#2D3748;">${item.title}</h3>
                  <div class="card-subtitle-line" style="font-size:0.76rem; color:#718096; margin:3px 0 6px;">${item.subtitle}</div>
                </div>
              </div>
              
              <p class="card-clean-concise-desc">${item.desc}</p>

              <!-- 底部極簡雙按鈕 (抗疲勞，查看實況 ＋ 散策指引) -->
              <div class="clean-action-row">
                <a href="${klookFinalUrl}" target="_blank" class="btn-clean-primary" onclick="event.stopPropagation();">
                  <span>🌸 查看現場實況</span>
                </a>
                <button class="btn-clean-secondary" onclick="openReadingSheet('${item.id}'); event.stopPropagation();">
                  <span>🚶 散策指引</span>
                </button>
              </div>
            </div>
          `;
          container.appendChild(card);
          return;
        }

        card.innerHTML = `
          <div class="feed-snap-img">
            <img src="${item.img}" alt="${item.spot}" loading="lazy">
            <div class="feed-time-chip">⏱️ ${item.time}</div>
            <div class="feed-bloom-level">${item.bloom}</div>
          </div>
          <div class="feed-snap-body">
            <div class="feed-user-line">
              <span>${item.user}</span>・<span style="color:#6B8CA8; font-weight:800;">${item.spot}</span>
            </div>
            <p class="feed-comment-text">${item.comment}</p>
          </div>
        `;
        container.appendChild(card);
      });
      startNisekoCarousel();
    }

    // [頂部第一層：4 大情境母夾] 完整架構設定
    let MASTER_HUBS_CONFIG = {};

    let currentMasterHub = 'flower';
    let currentSubItemId = 'sakura_bloom';

    function switchMasterHub(hubKey, el) {
      currentMasterHub = hubKey;
      document.querySelectorAll('.deal-big-card').forEach(c => c.classList.remove('active'));
      if (el) el.classList.add('active');
      const found = document.getElementById(`dealCard_${hubKey}`);
      if (found) found.classList.add('active');

      const config = MASTER_HUBS_CONFIG[hubKey] || MASTER_HUBS_CONFIG['flower'];
      currentSubItemId = config.subItems[0].id;
      if (config.subItems[0].type === 'season') {
        currentSeason = config.subItems[0].val;
      } else if (hubKey === 'snow') {
        currentSeason = 'snow';
        currentSnowLevel = 'all';
        currentSnowRegion = 'all';
        document.body.className = 'mode-snow';
      }

      renderSubContextPills();
      renderDynamicRegionBar();
      renderFeatureFilterBar();
      renderCards();
      renderCommunityFeeds();
      initCanvasFX();
    }

    function renderSubContextPills() {
      const container = document.getElementById('subContextPillsContainer');
      const navBar = document.getElementById('subContextNavBar');
      if (!container) return;

      const config = MASTER_HUBS_CONFIG[currentMasterHub] || MASTER_HUBS_CONFIG['flower'];
      const items = config.subItems || [];

      if (items.length === 0) {
        if (navBar) navBar.style.display = 'none';
        container.innerHTML = '';
        return;
      }

      if (navBar) navBar.style.display = 'block';

      container.innerHTML = items.map(item => {
        const isActive = item.id === currentSubItemId;
        return `
          <button class="sub-context-pill ${isActive ? 'active' : ''}" 
                  data-id="${item.id}" 
                  onclick="handleSubItemSelection('${item.id}', this)">
            <span class="sub-pill-name">${item.name}</span>
          </button>
        `;
      }).join('');
    }

    function handleSubItemSelection(itemId, btn) {
      currentSubItemId = itemId;
      const config = MASTER_HUBS_CONFIG[currentMasterHub] || MASTER_HUBS_CONFIG['flower'];
      const item = config.subItems.find(s => s.id === itemId);
      if (!item) return;

      // 更新 pills active 樣式
      const container = document.getElementById('subContextPillsContainer');
      if (container) {
        container.querySelectorAll('.sub-context-pill').forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-id') === itemId);
        });
      }

      // 重設地區快篩
      currentSakuraRegion = 'all';

      if (item.id === 'fuji_wisteria' || item.val === 'wisteria') {
        currentSeason = 'wisteria';
        document.body.className = 'mode-wisteria';
      } else if (item.id === 'nemophila_sea' || item.val === 'nemophila') {
        currentSeason = 'nemophila';
        document.body.className = 'mode-nemophila';
      } else if (item.id === 'hydrangea_season' || item.val === 'hydrangea') {
        currentSeason = 'hydrangea';
        document.body.className = 'mode-hydrangea';
      } else if (item.id === 'lavender_field' || item.val === 'lavender') {
        currentSeason = 'lavender';
        document.body.className = 'mode-lavender';
      } else if (item.id === 'shibazakura_carpet' || item.val === 'shibazakura') {
        currentSeason = 'shibazakura';
        document.body.className = 'mode-shibazakura';
      } else if (item.id === 'momiji_view' || item.val === 'momiji') {
        currentSeason = 'momiji';
        document.body.className = 'mode-momiji';
      } else if (item.id === 'ginkgo_gold' || item.val === 'ginkgo') {
        currentSeason = 'ginkgo';
        document.body.className = 'mode-ginkgo';
      } else if (item.id === 'sakura_bloom' || item.val === 'sakura') {
        currentSeason = 'sakura';
        document.body.className = 'mode-sakura';
      } else if (item.type === 'season') {
        currentSeason = item.val;
        document.body.className = `mode-${item.val}`;
      } else if (item.type === 'camp_type') {
        currentCampType = item.val;
      } else if (item.type === 'snow_level') {
        currentSnowLevel = item.val;
        currentSeason = 'snow';
        document.body.className = 'mode-snow';
      } else if (item.type === 'portal') {
        if (window[item.val]) {
          window[item.val]();
          return;
        }
      }

      // ⛩️ 更新看板標題
      const titleHint = document.getElementById('spotsCountHint');
      if (titleHint) {
        const titles = {
          'sakura': '🌸 櫻花名所',
          'wisteria': '💜 紫藤名所',
          'nemophila': '💙 粉蝶花海名所',
          'hydrangea': '🪻 繡球花名所',
          'momiji': '🍁 紅葉名所',
          'ginkgo': '🍂 黃金銀杏名所'
        };
        titleHint.textContent = titles[currentSeason] || '即時精選名所';
      }

      renderDynamicRegionBar();
      renderFeatureFilterBar();
      renderCards();
      renderCommunityFeeds();
      initCanvasFX();
    }


    let currentSnowRegion = 'all';
    let currentSnowLevel = 'all';

    function selectSnowRegion(regKey, btn) {
      currentSnowRegion = regKey;
      const bar = document.getElementById('sakuraRegionBar');
      if (bar) {
        bar.querySelectorAll('.region-pill').forEach(b => b.classList.remove('active'));
      }
      if (btn) btn.classList.add('active');
      renderCards();
    }

    let currentCampRegion = 'all';
    let currentCampType = 'all';

    function selectCampRegion(regKey, btn) {
      currentCampRegion = regKey;
      const bar = document.getElementById('sakuraRegionBar');
      if (bar) {
        bar.querySelectorAll('.region-pill').forEach(b => b.classList.remove('active'));
      }
      if (btn) btn.classList.add('active');
      renderCards();
    }


    // ⛷️ 二世谷全景輪播自動滑動
    let nisekoCurrentSlide = 0;
    let nisekoSlideTimer = null;
    function setNisekoSlide(idx) {
      nisekoCurrentSlide = idx;
      const track = document.getElementById('nisekoTrack');
      if (track) {
        track.style.transform = `translateX(-${idx * 25}%)`;
      }
      const dots = document.querySelectorAll('.niseko-dot');
      dots.forEach((d, i) => {
        d.style.opacity = (i === idx) ? '0.9' : '0.4';
      });
    }
    function startNisekoCarousel() {
      if (nisekoSlideTimer) clearInterval(nisekoSlideTimer);
      const track = document.getElementById('nisekoTrack');
      if (!track) return;
      nisekoSlideTimer = setInterval(() => {
        const curTrack = document.getElementById('nisekoTrack');
        if (!curTrack) return;
        nisekoCurrentSlide = (nisekoCurrentSlide + 1) % 4;
        setNisekoSlide(nisekoCurrentSlide);
      }, 3500);
    }

    // ⛷️ 極上粉雪卡片內部折疊抽屜切換 (周邊雪見溫泉 ＆ 巡邏隊急診骨科指南)
    function toggleSnowDrawer(spotId, drawerType, btn) {
      const panelId = drawerType === 'onsen' ? `snowOnsen_${spotId}` : `snowSafety_${spotId}`;
      const panel = document.getElementById(panelId);
      if (!panel) return;
      const isShow = panel.classList.contains('show');
      panel.classList.toggle('show', !isShow);
      if (btn) btn.classList.toggle('active', !isShow);

      if (drawerType === 'onsen') {
        btn.innerHTML = !isShow ? '<span>♨️ 收起溫泉推薦 ▴</span>' : '<span>♨️ 周邊雪見美人湯 ▾</span>';
      } else {
        btn.innerHTML = !isShow ? '<span>🚑 收起就醫指南 ▴</span>' : '<span>🚑 巡邏隊 ＆ 骨科指南 ▾</span>';
      }
    }

    function toggleCampQa(spotId, btn) {
      const panel = document.getElementById(`campQa_${spotId}`);
      if (!panel) return;
      const isShow = panel.classList.contains('show');
      panel.classList.toggle('show', !isShow);
      btn.innerHTML = isShow
        ? '<span>自駕須知 ▾</span>'
        : '<span>收起自駕須知 ▴</span>';
    }


    // 🌙 白天與夜間點燈狀態管理與快篩
    let spotDayNightState = {};
    let currentSakuraFeature = 'all'; // 'all' | 'night' | 'full_bloom' | 'yaezakura' | 'yoshino'
    let currentMomijiFeature = 'all'; // 'all' | 'night' | 'temple' | 'peak' | 'gorge'

    function toggleSpotDayNight(spotId, event) {
      if (event) event.stopPropagation();
      const current = spotDayNightState[spotId] || 'day';
      spotDayNightState[spotId] = (current === 'day') ? 'night' : 'day';
      updateSpotCardDayNightUI(spotId);
    }

    function updateSpotCardDayNightUI(spotId) {
      const card = document.getElementById(`spot-card-${spotId}`);
      if (!card) return;
      const isNight = (spotDayNightState[spotId] === 'night');
      const item = SPOTS_DATABASE.find(s => s.id === spotId);
      if (!item) return;

      const imgEl = card.querySelector('.card-img-box img');
      const toggleBtn = card.querySelector('.card-daynight-toggle');
      const nightBadge = card.querySelector('.card-night-illum-badge');
      const calloutBox = card.querySelector('.meguro-night-callout-box');
      const nightMeta = card.querySelector('.spot-night-meta');

      const nightPhoto = item.nightImg || (item.theme === 'momiji'
        ? 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=700&q=80'
        : './images/meguro_night_sakura.jpg');

      if (imgEl) {
        imgEl.style.transition = 'opacity 0.25s ease';
        imgEl.style.opacity = '0.4';
        setTimeout(() => {
          imgEl.src = isNight ? nightPhoto : item.img;
          imgEl.style.opacity = '1';
        }, 120);
      }

      if (toggleBtn) {
        toggleBtn.classList.toggle('is-night', isNight);
        const modeName = item.theme === 'momiji' ? '夜楓點燈' : '夜櫻點燈';
        const txt = toggleBtn.querySelector('.daynight-text');
        if (txt) txt.textContent = isNight ? modeName : '白天景致';
        const ico = toggleBtn.querySelector('.daynight-icon');
        if (ico) ico.textContent = isNight ? '🌙' : '☀️';
      }

      if (nightBadge) {
        nightBadge.style.display = isNight ? 'flex' : 'none';
      }

      if (nightMeta) {
        nightMeta.style.display = (isNight || item.hasNightLight) ? 'inline-flex' : 'none';
      }

      if (calloutBox) {
        calloutBox.classList.toggle('is-night', isNight);
        const actionBtn = calloutBox.querySelector('.callout-action-btn');
        if (actionBtn) {
          actionBtn.textContent = isNight ? '切換白天 ☀️' : '切換夜景 🌙';
        }
      }
    }

    function selectSakuraFeature(featKey, btn) {
      currentSakuraFeature = featKey;
      const bar = document.getElementById('featureFilterBar');
      if (bar) {
        bar.querySelectorAll('.feature-filter-pill').forEach(b => b.classList.remove('active'));
      }
      if (btn) btn.classList.add('active');
      renderCards();
    }

    function selectMomijiFeature(featKey, btn) {
      currentMomijiFeature = featKey;
      const bar = document.getElementById('featureFilterBar');
      if (bar) {
        bar.querySelectorAll('.feature-filter-pill').forEach(b => b.classList.remove('active'));
      }
      if (btn) btn.classList.add('active');
      renderCards();
    }

    let currentWisteriaFeature = 'all';
    let currentNemophilaFeature = 'all';
    let currentHydrangeaFeature = 'all';
    let currentGinkgoFeature = 'all';

    function selectWisteriaFeature(featKey, btn) {
      currentWisteriaFeature = featKey;
      const bar = document.getElementById('featureFilterBar');
      if (bar) bar.querySelectorAll('.feature-filter-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderCards();
    }

    function selectNemophilaFeature(featKey, btn) {
      currentNemophilaFeature = featKey;
      const bar = document.getElementById('featureFilterBar');
      if (bar) bar.querySelectorAll('.feature-filter-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderCards();
    }

    function selectHydrangeaFeature(featKey, btn) {
      currentHydrangeaFeature = featKey;
      const bar = document.getElementById('featureFilterBar');
      if (bar) bar.querySelectorAll('.feature-filter-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderCards();
    }

    function selectGinkgoFeature(featKey, btn) {
      currentGinkgoFeature = featKey;
      const bar = document.getElementById('featureFilterBar');
      if (bar) bar.querySelectorAll('.feature-filter-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderCards();
    }

    function renderFeatureFilterBar() {
      const bar = document.getElementById('featureFilterBar');
      if (!bar) return;

      if (currentMasterHub !== 'flower') {
        bar.style.display = 'none';
        bar.innerHTML = '';
        return;
      }

      const activeTheme = currentSeason;

      if (activeTheme === 'wisteria') {
        bar.style.display = 'flex';
        bar.innerHTML = `
          <button class="feature-filter-pill pill-wisteria ${currentWisteriaFeature === 'all' ? 'active' : ''}" onclick="selectWisteriaFeature('all', this)">
            <span>全部紫藤 (ALL)</span>
          </button>
          <button class="feature-filter-pill pill-wisteria ${currentWisteriaFeature === 'night' ? 'active' : ''}" onclick="selectWisteriaFeature('night', this)">
            <span>夜藤點燈</span>
          </button>
          <button class="feature-filter-pill pill-wisteria ${currentWisteriaFeature === 'ancient' ? 'active' : ''}" onclick="selectWisteriaFeature('ancient', this)">
            <span>樹齡百年奇蹟大藤</span>
          </button>
          <button class="feature-filter-pill pill-wisteria ${currentWisteriaFeature === 'tunnel' ? 'active' : ''}" onclick="selectWisteriaFeature('tunnel', this)">
            <span>百米紫藤長廊</span>
          </button>
          <button class="feature-filter-pill pill-wisteria ${currentWisteriaFeature === 'white' ? 'active' : ''}" onclick="selectWisteriaFeature('white', this)">
            <span>珍稀白藤・八重黑龍藤</span>
          </button>
        `;
      } else if (activeTheme === 'nemophila') {
        bar.style.display = 'flex';
        bar.innerHTML = `
          <button class="feature-filter-pill pill-nemophila ${currentNemophilaFeature === 'all' ? 'active' : ''}" onclick="selectNemophilaFeature('all', this)">
            <span>全部粉蝶花 (ALL)</span>
          </button>
          <button class="feature-filter-pill pill-nemophila ${currentNemophilaFeature === 'night' ? 'active' : ''}" onclick="selectNemophilaFeature('night', this)">
            <span>夜間點燈 / 幻藍之夜</span>
          </button>
          <button class="feature-filter-pill pill-nemophila ${currentNemophilaFeature === 'hill' ? 'active' : ''}" onclick="selectNemophilaFeature('hill', this)">
            <span>蔚藍山丘花海</span>
          </button>
          <button class="feature-filter-pill pill-nemophila ${currentNemophilaFeature === 'sunset' ? 'active' : ''}" onclick="selectNemophilaFeature('sunset', this)">
            <span>海風夕陽花田</span>
          </button>
          <button class="feature-filter-pill pill-nemophila ${currentNemophilaFeature === 'train' ? 'active' : ''}" onclick="selectNemophilaFeature('train', this)">
            <span>觀光鐵道花丘</span>
          </button>
          <button class="feature-filter-pill pill-nemophila ${currentNemophilaFeature === 'ferris' ? 'active' : ''}" onclick="selectNemophilaFeature('ferris', this)">
            <span>摩天輪花海全景</span>
          </button>
        `;
      } else if (activeTheme === 'hydrangea') {
        bar.style.display = 'flex';
        bar.innerHTML = `
          <button class="feature-filter-pill pill-hydrangea ${currentHydrangeaFeature === 'all' ? 'active' : ''}" onclick="selectHydrangeaFeature('all', this)">
            <span>🪻 全部繡球花 (ALL)</span>
          </button>
          <button class="feature-filter-pill pill-hydrangea ${currentHydrangeaFeature === 'temple' ? 'active' : ''}" onclick="selectHydrangeaFeature('temple', this)">
            <span>⛩️ 古寺紫陽花階梯</span>
          </button>
          <button class="feature-filter-pill pill-hydrangea ${currentHydrangeaFeature === 'train' ? 'active' : ''}" onclick="selectHydrangeaFeature('train', this)">
            <span>🚂 江之電鐵道繡球花</span>
          </button>
          <button class="feature-filter-pill pill-hydrangea ${currentHydrangeaFeature === 'sea' ? 'active' : ''}" onclick="selectHydrangeaFeature('sea', this)">
            <span>🌊 蔚藍海景花道</span>
          </button>
          <button class="feature-filter-pill pill-hydrangea ${currentHydrangeaFeature === 'water' ? 'active' : ''}" onclick="selectHydrangeaFeature('water', this)">
            <span>💧 雨後苔庭水鏡</span>
          </button>
        `;
      } else if (activeTheme === 'momiji') {
        bar.style.display = 'flex';
        bar.innerHTML = `
          <button class="feature-filter-pill pill-momiji ${currentMomijiFeature === 'all' ? 'active' : ''}" onclick="selectMomijiFeature('all', this)">
            <span>全部紅葉名所 (ALL)</span>
          </button>
          <button class="feature-filter-pill pill-momiji ${currentMomijiFeature === 'night' ? 'active' : ''}" onclick="selectMomijiFeature('night', this)">
            <span>夜楓點燈</span>
          </button>
          <button class="feature-filter-pill pill-momiji ${currentMomijiFeature === 'temple' ? 'active' : ''}" onclick="selectMomijiFeature('temple', this)">
            <span>寺廟庭園名楓</span>
          </button>
          <button class="feature-filter-pill pill-momiji ${currentMomijiFeature === 'peak' ? 'active' : ''}" onclick="selectMomijiFeature('peak', this)">
            <span>見頃火紅</span>
          </button>
          <button class="feature-filter-pill pill-momiji ${currentMomijiFeature === 'gorge' ? 'active' : ''}" onclick="selectMomijiFeature('gorge', this)">
            <span>溪谷峽谷絕景</span>
          </button>
          <button class="feature-filter-pill pill-momiji-cafe ${currentMomijiFeature === 'cafe' ? 'active' : ''}" onclick="selectMomijiFeature('cafe', this)" title="賞楓紅葉景觀咖啡名所">
            <span><img src="./images/icon_cafe.png" style="width:15px; height:15px; object-fit:contain; vertical-align:-2px; margin-right:3px;">賞楓咖啡店</span>
          </button>
        `;
      } else if (activeTheme === 'ginkgo') {
        // 🍂 使用者指示：點銀杏只會有銀杏和地區的出現，不顯示子分類快篩列
        bar.style.display = 'none';
        bar.innerHTML = '';
      } else if (activeTheme === 'sakura') {
        bar.style.display = 'flex';
        bar.innerHTML = `
          <button class="feature-filter-pill pill-sakura ${currentSakuraFeature === 'all' ? 'active' : ''}" onclick="selectSakuraFeature('all', this)">
            <span>全部櫻花 (ALL)</span>
          </button>
          <button class="feature-filter-pill pill-sakura ${currentSakuraFeature === 'night' ? 'active' : ''}" onclick="selectSakuraFeature('night', this)">
            <span>夜櫻點燈</span>
          </button>
          <button class="feature-filter-pill pill-sakura ${currentSakuraFeature === 'full_bloom' ? 'active' : ''}" onclick="selectSakuraFeature('full_bloom', this)">
            <span>滿開吹雪</span>
          </button>
          <button class="feature-filter-pill pill-sakura ${currentSakuraFeature === 'yaezakura' ? 'active' : ''}" onclick="selectSakuraFeature('yaezakura', this)">
            <span>晚開八重櫻</span>
          </button>
          <button class="feature-filter-pill pill-sakura ${currentSakuraFeature === 'yoshino' ? 'active' : ''}" onclick="selectSakuraFeature('yoshino', this)">
            <span>染井吉野櫻</span>
          </button>
          <button class="feature-filter-pill pill-sakura-cafe ${currentSakuraFeature === 'cafe' ? 'active' : ''}" onclick="selectSakuraFeature('cafe', this)" title="全日本 40 家近距離賞櫻景觀咖啡名所">
            <span><img src="./images/icon_cafe.png" style="width:15px; height:15px; object-fit:contain; vertical-align:-2px; margin-right:3px;">賞櫻咖啡店</span>
          </button>
        `;
      } else {
        bar.style.display = 'none';
        bar.innerHTML = '';
      }
    }

    function renderDynamicRegionBar() {
      const bar = document.getElementById('sakuraRegionBar');
      if (!bar) return;

      if (currentMasterHub === 'camp_charter') {
        bar.style.display = 'block';
        bar.innerHTML = `
          <div class="region-pills-scroll" style="display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
            <button class="region-pill ${currentCampRegion === 'all' ? 'active' : ''}" onclick="selectCampRegion('all', this)">
              <span>全日本 (15)</span>
            </button>
            <button class="region-pill ${currentCampRegion === 'fuji' ? 'active' : ''}" onclick="selectCampRegion('fuji', this)">
              <span>富士五湖 (5)</span>
            </button>
            <button class="region-pill ${currentCampRegion === 'hokkaido' ? 'active' : ''}" onclick="selectCampRegion('hokkaido', this)">
              <span>北海道 (3)</span>
            </button>
            <button class="region-pill ${currentCampRegion === 'nagano' ? 'active' : ''}" onclick="selectCampRegion('nagano', this)">
              <span>長野 (3)</span>
            </button>
            <button class="region-pill ${currentCampRegion === 'kansai_izu' ? 'active' : ''}" onclick="selectCampRegion('kansai_izu', this)">
              <span>關西伊豆 (4)</span>
            </button>
          </div>
        `;
      } else if (currentMasterHub === 'snow') {
        bar.style.display = 'block';
        bar.innerHTML = `
          <div class="region-pills-scroll" style="display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
            <button class="region-pill ${currentSnowRegion === 'all' ? 'active' : ''}" onclick="selectSnowRegion('all', this)">
              <span>全日本雪場 (27)</span>
            </button>
            <button class="region-pill ${currentSnowRegion === 'hokkaido' ? 'active' : ''}" onclick="selectSnowRegion('hokkaido', this)">
              <span>❄️ 北海道 (7)</span>
            </button>
            <button class="region-pill ${currentSnowRegion === 'niigata' ? 'active' : ''}" onclick="selectSnowRegion('niigata', this)">
              <span>🌾 新潟・湯澤 (6)</span>
            </button>
            <button class="region-pill ${currentSnowRegion === 'nagano' ? 'active' : ''}" onclick="selectSnowRegion('nagano', this)">
              <span>🏔️ 長野・白馬 (6)</span>
            </button>
            <button class="region-pill ${currentSnowRegion === 'tohoku' ? 'active' : ''}" onclick="selectSnowRegion('tohoku', this)">
              <span>🌲 東北・藏王 (4)</span>
            </button>
            <button class="region-pill ${currentSnowRegion === 'gunma' ? 'active' : ''}" onclick="selectSnowRegion('gunma', this)">
              <span>♨️ 富士・關東 (4)</span>
            </button>
            <button class="region-pill ${currentSnowRegion === 'olympic_fis' ? 'active' : ''}" onclick="selectSnowRegion('olympic_fis', this)">
              <span>🏆 冬奧FIS賽道 (6)</span>
            </button>
          </div>
        `;
      } else if (currentMasterHub === 'flower') {
        bar.style.display = 'block';
        const labels = {
          'wisteria': '紫藤',
          'nemophila': '粉蝶花',
          'hydrangea': '繡球花',
          'momiji': '紅葉',
          'ginkgo': '銀杏',
          'sakura': '櫻花'
        };
        const curLabel = labels[currentSeason] || '名所';

        bar.innerHTML = `
          <div class="region-pills-scroll" style="display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px; scrollbar-width: none; -webkit-overflow-scrolling: touch;">
            <button class="region-pill ${currentSakuraRegion === 'all' ? 'active' : ''}" data-region="all" onclick="selectSakuraRegion('all', this)">
              <span>全部${curLabel} (ALL)</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'kanto' ? 'active' : ''}" data-region="kanto" onclick="selectSakuraRegion('kanto', this)">
              <span>東京・關東</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'kansai' ? 'active' : ''}" data-region="kansai" onclick="selectSakuraRegion('kansai', this)">
              <span>京都・大阪・關西</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'tohoku' ? 'active' : ''}" data-region="tohoku" onclick="selectSakuraRegion('tohoku', this)">
              <span>東北</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'chubu' ? 'active' : ''}" data-region="chubu" onclick="selectSakuraRegion('chubu', this)">
              <span>中部・北陸</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'hokkaido' ? 'active' : ''}" data-region="hokkaido" onclick="selectSakuraRegion('hokkaido', this)">
              <span>北海道</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'chugoku' ? 'active' : ''}" data-region="chugoku" onclick="selectSakuraRegion('chugoku', this)">
              <span>中國地區</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'shikoku' ? 'active' : ''}" data-region="shikoku" onclick="selectSakuraRegion('shikoku', this)">
              <span>四國</span>
            </button>
            <button class="region-pill ${currentSakuraRegion === 'kyushu' ? 'active' : ''}" data-region="kyushu" onclick="selectSakuraRegion('kyushu', this)">
              <span>九州</span>
            </button>
          </div>
        `;
      }
    }

    let currentViewMode = 'grid';

    function setViewMode(mode) {
      currentViewMode = mode;
      const btnGrid = document.getElementById('btnViewGrid');
      const btnList = document.getElementById('btnViewList');
      if (mode === 'grid') {
        if (btnGrid) btnGrid.classList.add('active');
        if (btnList) btnList.classList.remove('active');
      } else {
        if (btnGrid) btnGrid.classList.remove('active');
        if (btnList) btnList.classList.add('active');
      }
      renderCards();
    }

    function toggleCardDetails(btn, id) {
      const details = document.getElementById(`details-${id}`);
      if (!details) return;
      const isExpanded = details.classList.contains('expanded');
      if (isExpanded) {
        details.classList.remove('expanded');
        btn.innerHTML = '<span>展開詳情 ▾</span>';
      } else {
        details.classList.add('expanded');
        btn.innerHTML = '<span>收折詳情 ▴</span>';
      }
    }


    let currentSakuraRegion = 'all';

    function selectSakuraRegion(regionKey, btn) {
      currentSakuraRegion = regionKey;
      const bar = document.getElementById('sakuraRegionBar');
      if (bar) {
        bar.querySelectorAll('.region-pill').forEach(pill => {
          pill.classList.toggle('active', pill.getAttribute('data-region') === regionKey);
        });
      }
      renderCards();
    }


    // 🌟 名所卡片微型分頁切換控制 (美食日料 / 推薦住宿)
    function switchSpotCardTab(spotId, tabKey, btn) {
      const parentCard = document.getElementById(`spot-card-${spotId}`);
      if (!parentCard) return;

      parentCard.querySelectorAll('.spot-switch-pill').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      const pane = document.getElementById(`tabPane_${spotId}`);
      if (!pane) return;

      const spot = SPOTS_DATABASE.find(s => s.id === spotId) || {};
      const cafeObj = spot.sakuraCafe || spot.momijiCafe || spot.cafe;
      const cafeName = cafeObj ? cafeObj.name : `${spot.title || '名所'} 景觀咖啡工坊`;
      const cafeFeature = cafeObj ? cafeObj.feature : '水岸窗景・露台第一排・步行3分鐘即達';

      const defaultJapanFood = (spot.title && spot.title.includes('舞鶴公園'))
        ? '舞鶴公園（福岡城跡） 黑毛和牛壽喜燒 / 割烹壽司'
        : `${spot.title || '名所'} 黑毛和牛壽喜燒 / 割烹壽司`;
      const japanFoodName = spot.japanFood ? spot.japanFood.name : defaultJapanFood;
      const hotelName = spot.hotel ? spot.hotel.name : `${spot.title || '名所'} 周邊景觀溫泉飯店 / 設計旅宿`;

      if (tabKey === 'food') {
        pane.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div class="spot-nav-food-row" onclick="openGoogleNavModal('${encodeURIComponent(japanFoodName)}', '${encodeURIComponent(spot.title || '')}'); event.stopPropagation();" title="點擊規劃導航路線" style="cursor:pointer; padding:6px 4px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s;">
              <div style="color:#1E293B; font-weight:700; font-size:0.75rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                日料推薦：${japanFoodName}
              </div>
              <span style="color:#94A3B8; font-size:0.95rem; font-weight:600; margin-left:8px; line-height:1;">›</span>
            </div>
            <div class="spot-nav-cafe-row" onclick="openGoogleNavModal('${encodeURIComponent(cafeName)}', '${encodeURIComponent(spot.title || '')}'); event.stopPropagation();" title="點擊規劃導航路線" style="cursor:pointer; padding:6px 4px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s; border-top:1px solid #F1F5F9;">
              <div style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                <span style="color:#1E293B; font-weight:700; font-size:0.75rem;">景觀咖啡：${cafeName}</span>
                <span style="color:#64748B; font-size:0.7rem; margin-left:6px;">${cafeFeature}</span>
              </div>
              <span style="color:#94A3B8; font-size:0.95rem; font-weight:600; margin-left:8px; line-height:1;">›</span>
            </div>
          </div>
        `;
      } else if (tabKey === 'stay') {
        const cleanSpotTitle = (spot.title || '').replace(/（[^）]*）|\([^)]*\)/g, '').trim();
        const spotCity = getSpotCity(spot);
        const tripSearchQuery = cleanSpotTitle ? `${cleanSpotTitle} ${spotCity}` : (spot.title || '日本');
        const tripUrl = buildTripHotelUrl(tripSearchQuery);
        pane.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:4px;">
            <a href="${tripUrl}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();" style="text-decoration:none; display:flex; align-items:center; justify-content:space-between; padding:6px 4px; transition:all 0.2s;">
              <div style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                <span style="color:#0369A1; font-weight:700; font-size:0.75rem;">推薦住宿：${hotelName}</span>
                <span style="color:#64748B; font-size:0.7rem; margin-left:6px;">近${cleanSpotTitle || '名所'}周邊・Trip.com 最優訂房</span>
              </div>
              <span style="color:#0284C7; font-size:0.95rem; font-weight:600; margin-left:8px; line-height:1;">›</span>
            </a>
          </div>
        `;
      }
    }

    function renderCards() {
      const container = document.getElementById('cards-container');
      if (!container) return;
      container.innerHTML = '';

      // 🛡️ 若非賞花前線（如露營自駕、極上粉雪、鐵道），櫻花快篩列必須 100% 徹底刪除與隱藏！
      const featBar = document.getElementById('featureFilterBar');
      if (featBar && currentMasterHub !== 'flower') {
        featBar.style.display = 'none';
        featBar.innerHTML = '';
      }

      const config = MASTER_HUBS_CONFIG[currentMasterHub] || MASTER_HUBS_CONFIG['flower'];
      const activeSub = config.subItems.find(s => s.id === currentSubItemId) || config.subItems[0];

      const filtered = SPOTS_DATABASE.filter(item => {
        if (currentCategory === 'report-only') return item.report && item.report.hasReport;

        // 母夾 1：賞花前線 (支援 8 大地區過濾 ＋ 多維度快篩)
        if (currentMasterHub === 'flower') {
          let matchSeason = false;
          if (activeSub.type === 'season') {
            matchSeason = (item.theme === activeSub.val);
          } else if (activeSub.type === 'spot_id') {
            matchSeason = (item.id === activeSub.val || item.theme === 'flower' || item.theme === 'sakura');
          } else {
            matchSeason = ['sakura', 'momiji', 'ginkgo', 'flower'].includes(item.theme);
          }
          if (!matchSeason) return false;

          // 🗾 8 大地區通用過濾 (通用於櫻花、紫藤、粉蝶花、繡球花、秋楓、銀杏等)
          if (currentSakuraRegion !== 'all') {
            const r = item.region || '';
            if (currentSakuraRegion === 'kanto') {
              if (!(r === 'kanto' || r === 'tokyo')) return false;
            } else if (currentSakuraRegion === 'kansai') {
              if (!(r === 'kansai' || r === 'kyoto' || r === 'osaka' || r === 'hyogo' || r === 'nara' || r === 'shiga' || r === 'wakayama')) return false;
            } else if (currentSakuraRegion === 'chubu') {
              if (!(r === 'chubu' || r === 'hokuriku')) return false;
            } else if (currentSakuraRegion === 'chugoku') {
              if (!(r === 'chugoku' || r === 'hiroshima' || r === 'okayama' || r === 'shimane' || r === 'tottori' || r === 'yamaguchi')) return false;
            } else if (currentSakuraRegion === 'shikoku') {
              if (!(r === 'shikoku' || r === 'kagawa' || r === 'tokushima' || r === 'ehime' || r === 'kochi')) return false;
            } else if (currentSakuraRegion === 'kyushu') {
              if (!(r === 'kyushu' || r === 'fukuoka' || r === 'kumamoto' || r === 'nagasaki' || r === 'oita' || r === 'kagoshima')) return false;
            } else if (currentSakuraRegion === 'tohoku') {
              if (!(r === 'tohoku' || r === 'aomori' || r === 'akita' || r === 'iwate' || r === 'miyagi' || r === 'yamagata' || r === 'fukushima')) return false;
            } else if (currentSakuraRegion === 'hokkaido') {
              if (!(r === 'hokkaido')) return false;
            } else if (r !== currentSakuraRegion) {
              return false;
            }
          }

          // 🌸 櫻花過濾
          if (item.theme === 'sakura' || activeSub.val === 'sakura') {
            if (currentSakuraFeature === 'night') {
              if (!(item.hasNightLight || (item.nightHours && item.nightHours.length > 0))) return false;
            } else if (currentSakuraFeature === 'full_bloom') {
              const b = (item.bloomStatus || '') + (item.desc || '');
              if (!(b.includes('100%') || b.includes('滿開') || b.includes('吹雪'))) return false;
            } else if (currentSakuraFeature === 'yaezakura') {
              const s = (item.species || '') + (item.title || '') + (item.subtitle || '');
              if (!(s.includes('八重') || s.includes('枝垂') || s.includes('里櫻') || s.includes('晚櫻'))) return false;
            } else if (currentSakuraFeature === 'yoshino') {
              const s = (item.species || '') + (item.title || '') + (item.subtitle || '');
              if (!(s.includes('染井吉野') || s.includes('吉野'))) return false;
            } else if (currentSakuraFeature === 'cafe') {
              if (!item.sakuraCafe) return false;
            }
            return true;
          }

          // 💜 紫藤過濾
          if (item.theme === 'wisteria' || activeSub.val === 'wisteria') {
            if (currentWisteriaFeature === 'night') {
              if (!(item.hasNightLight || (item.nightHours && item.nightHours.length > 0))) return false;
            } else if (currentWisteriaFeature === 'ancient') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(t.includes('百年') || t.includes('古藤') || t.includes('大藤') || t.includes('奇蹟') || t.includes('天然記念物') || t.includes('1200年') || t.includes('600年'))) return false;
            } else if (currentWisteriaFeature === 'tunnel') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(t.includes('長廊') || t.includes('隧道') || t.includes('棚') || t.includes('公尺') || t.includes('走廊'))) return false;
            } else if (currentWisteriaFeature === 'white') {
              const s = (item.species || '') + (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(s.includes('白藤') || s.includes('八重') || s.includes('黑龍') || s.includes('黃花藤') || s.includes('珍稀'))) return false;
            }
            return true;
          }

          // 💙 粉蝶花過濾
          if (item.theme === 'nemophila' || activeSub.val === 'nemophila') {
            if (currentNemophilaFeature === 'night') {
              if (!(item.hasNightLight || (item.nightHours && item.nightHours.length > 0))) return false;
            } else if (currentNemophilaFeature === 'hill') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(t.includes('山丘') || t.includes('丘') || t.includes('見晴') || t.includes('高原') || t.includes('草坡'))) return false;
            } else if (currentNemophilaFeature === 'sunset') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(t.includes('夕') || t.includes('海') || t.includes('風') || t.includes('灣') || t.includes('落日'))) return false;
            } else if (currentNemophilaFeature === 'train') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '') + (item.locationDetail || '');
              if (!(t.includes('鐵道') || t.includes('列車') || t.includes('線') || t.includes('站') || t.includes('火車'))) return false;
            }
            return true;
          }

          // 🍁 秋楓過濾
          if (item.theme === 'momiji' || activeSub.val === 'momiji') {
            if (currentMomijiFeature === 'night') {
              if (!(item.hasNightLight || (item.nightHours && item.nightHours.length > 0))) return false;
            } else if (currentMomijiFeature === 'temple') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(item.isTemple || t.includes('寺') || t.includes('院') || t.includes('堂') || t.includes('神社'))) return false;
            } else if (currentMomijiFeature === 'peak') {
              const b = (item.bloomStatus || '') + (item.desc || '');
              if (!(b.includes('見頃') || b.includes('100%') || b.includes('火紅') || b.includes('盛紅'))) return false;
            } else if (currentMomijiFeature === 'gorge') {
              const t = (item.title || '') + (item.subtitle || '') + (item.desc || '');
              if (!(t.includes('川') || t.includes('湖') || t.includes('瀑布') || t.includes('峽') || t.includes('池') || t.includes('谷'))) return false;
            }
            return true;
          }

          // 🍂 銀杏：使用者指示只顯示銀杏與地區，直接返回 true
          if (item.theme === 'ginkgo' || activeSub.val === 'ginkgo') {
            return true;
          }

          return true;
        }

        // 母夾 2：極上粉雪 (支援 5 大雪區 ＋ 1 國際賽道特輯 ＋ 難度分級)
        if (currentMasterHub === 'snow') {
          if (item.theme !== 'snow') return false;

          // 地區過濾
          if (currentSnowRegion !== 'all') {
            if (currentSnowRegion === 'olympic_fis') {
              if (!item.isOlympicFis) return false;
            } else if (currentSnowRegion === 'gunma') {
              if (item.snowRegion !== 'gunma' && item.snowRegion !== 'kanto_fuji') return false;
            } else {
              if (item.snowRegion !== currentSnowRegion) return false;
            }
          }

          // 難度二級過濾
          if (currentSnowLevel !== 'all') {
            if (item.skiLevel !== currentSnowLevel) return false;
          }

          return true;
        }

        // 母夾 3：露營與自駕 (嚴格排除鐵道特急，專注露營與自駕路線)
        if (currentMasterHub === 'camp_charter') {
          if (item.theme !== 'camp') return false;

          // 地區過濾
          if (currentCampRegion !== 'all') {
            if (item.campRegion && item.campRegion !== currentCampRegion) return false;
          }

          // 情境二級過濾 (Auto Camp / Glamping / Vanlife)
          if (currentCampType !== 'all') {
            if (item.campType && item.campType !== currentCampType) return false;
          }

          return true;
        }

        // 母夾 4：深度專題
        if (currentMasterHub === 'topics') {
          if (activeSub.id === 'topic_hanabi') return item.theme === 'hanabi';
          if (activeSub.id === 'topic_train') return item.theme === 'train';
          if (activeSub.id === 'topic_acg') return item.theme === 'acg';
          if (activeSub.id === 'topic_sports') return item.theme === 'sports';
          return ['hanabi', 'train', 'acg', 'sports'].includes(item.theme);
        }

        return true;
      });

      // 更新即時名所計數
      const hint = document.getElementById('spotsCountHint');
      if (hint) {
        const seasonName = {
          'spots': '全日本精選',
          'sakura': '🌸 櫻花名所',
          'hanabi': '🎆 夏夜花火',
          'snow': '❄️ 極上雪場',
          'momiji': '🍁 秋楓見頃',
          'ginkgo': '🍂 金黃銀杏'
        }[currentSeason] || '即時名所';
        hint.textContent = `${seasonName} (${filtered.length})`;
      }

      if (filtered.length === 0) {
        container.className = 'spots-grid-layout';
        container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:#A0AEC0;">
          <div style="font-size:38px; margin-bottom:8px;">⛩️</div>
          <div style="font-size:1rem; font-weight:900;">此條件下暫無景點，請點選「全部收錄」查看！</div>
        </div>`;
        return;
      }

      // 雙軌呈現：精簡條列模式 (List View)
      if (currentViewMode === 'list') {
        container.className = 'spots-list-layout';
        filtered.forEach(item => {
          const itemEl = document.createElement('div');
          itemEl.className = 'spot-list-item';
          itemEl.onclick = () => openReadingSheet(item.id);

          let metricTag = '';
          if (item.metrics) {
            metricTag = `<span class="spot-list-tag" style="color:#0284C7; background:#E0F2FE;">📊 ${item.metrics.depth}</span>`;
          }

          itemEl.innerHTML = `
            <img class="spot-list-thumb" src="${item.img}" alt="${item.title}" loading="lazy">
            <div class="spot-list-content">
              <div class="spot-list-title">${item.title}</div>
              <div class="spot-list-subtitle">${item.subtitle}</div>
              <div class="spot-list-tags">
                <span class="spot-list-tag">${item.tag}</span>
                ${metricTag}
                ${item.report && item.report.hasReport ? `<span class="spot-list-tag" style="color:#E11D48; background:#FFF1F5;">⚡ 特派員實測</span>` : ''}
              </div>
            </div>
            <div class="spot-list-arrow">➔</div>
          `;
          container.appendChild(itemEl);
        });
        return;
      }

      // 依 ID 去除重複項目
      const seenIds = new Set();
      const uniqueFiltered = [];
      filtered.forEach(it => {
        if (!seenIds.has(it.id)) {
          seenIds.add(it.id);
          uniqueFiltered.push(it);
        }
      });

      // 標準卡片模式 (3 欄 Grid + 漸進式揭露縮短高度 40%)
      container.className = 'spots-grid-layout';
      uniqueFiltered.forEach(item => {
        // 🌙 白天與夜晚點燈圖片與狀態切換 (先計算 isNight 避免 TDZ ReferenceError)
        const isNight = ((item.theme === 'sakura' && currentSakuraFeature === 'night') ||
          (item.theme === 'momiji' && currentMomijiFeature === 'night') ||
          (spotDayNightState[item.id] === 'night'));
        const isNightMomiji = (item.theme === 'momiji' && (currentMomijiFeature === 'night' || spotDayNightState[item.id] === 'night'));

        const card = document.createElement('div');
        card.className = `tabi-card theme-${item.theme} ${isNight ? 'is-night-theme-card' : ''} ${isNightMomiji ? 'card-night-momiji' : ''}`;
        card.id = `spot-card-${item.id}`;
        card.setAttribute('data-spot-id', item.id);

        const isFav = isFavorite(item.id);
        const klookFinalUrl = ensureKlookAffiliate(item.klookUrl, item);
        const bookingFinalUrl = ensureBookingAffiliate(item.bookingUrl, item);
        const isFlowerOrMomiji = (item.theme === 'sakura' || item.theme === 'momiji' || item.category === 'flower');
        const defaultNightPhoto = (item.theme === 'momiji')
          ? 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=700&q=80'
          : './images/meguro_night_sakura.jpg';
        const nightPhoto = item.nightImg || defaultNightPhoto;
        const activeCoverImg = isNight ? nightPhoto : item.img;

        // 站長親訪認證標籤
        const verifyBadge = (item.report && item.report.hasReport)
          ? `<span class="live-verify-badge">⚡ 今早 07:30 現場實測</span>`
          : ``;

        // 咖啡推薦資料
        const cafeObj = item.sakuraCafe || item.momijiCafe || item.cafe;
        const cafeName = cafeObj ? cafeObj.name : `${item.title} 景觀咖啡工坊`;
        const cafeFeature = cafeObj ? cafeObj.feature : '水岸窗景・露台第一排・步行3分鐘即達';

        // 日料推薦資料
        const defaultJapanFood = (item.title && item.title.includes('舞鶴公園'))
          ? '舞鶴公園（福岡城跡） 黑毛和牛壽喜燒 / 割烹壽司'
          : `${item.title} 黑毛和牛壽喜燒 / 割烹壽司`;
        const japanFoodName = item.japanFood ? item.japanFood.name : defaultJapanFood;
        const japanFoodFeature = item.japanFood ? item.japanFood.feature : '季節旬味套餐・嚴選道地風味・席位預定';

        // 米其林推薦資料
        const michelinName = item.michelin ? item.michelin.name : `${item.title} 周邊米其林嚴選席位`;
        const michelinFeature = 'KKday × Tabelog 專人代訂・免日文通話保證入席';

        // 附近賞櫻推薦資料
        const nearbySakuraName = item.rescueRoute ? item.rescueRoute.badge : ((item.region === 'kanto' || item.region === 'tokyo') ? '新宿御苑・濱離宮恩賜庭園' : '周邊晚開八重櫻接力名所');
        const nearbySakuraFeature = item.rescueRoute ? item.rescueRoute.message : '車程 20 分鐘直達・晚開八重櫻接棒・花期可延長至 4 月下旬！';

        // 飯店住宿推薦資料
        const hotelName = item.hotel ? item.hotel.name : `${item.title} 周邊景觀溫泉飯店 / 市區星級設計旅店`;
        const hotelFeature = 'Booking.com 站長嚴選推薦・近地鐵站無痛回房休息';

        // 目黑川專屬明顯夜間點燈提示盒
        const meguroNightCallout = (item.id === 'meguro_sakura') ? `
          <div class="meguro-night-callout-box ${isNight ? 'is-night' : ''}" onclick="toggleSpotDayNight('meguro_sakura', event)">
            <div class="meguro-callout-glow-pill">
              <span class="callout-glow-dot"></span>
              <span>🏮 夜間點燈名所・中目黑限定推薦</span>
            </div>
            <div class="meguro-callout-headline">800株染井吉野櫻形成4km粉紅水岸</div>
            <div class="meguro-callout-time">⏰ 點燈時間：17:00 - 20:00 ｜ 中之橋、南部橋粉紅雪洞燈籠點燈</div>
            
          </div>
        ` : '';

        // 🛡️ 徹底防護 undefined：全欄位保證優雅顯示，杜絕任何 undefined 字符
        const safeTitle = (item.title && item.title !== 'undefined') ? item.title : '日本精選名所';
        const safeSubtitle = (item.subtitle && item.subtitle !== 'undefined') ? item.subtitle : '';
        const safeTag = (item.tag && item.tag !== 'undefined') ? item.tag : (item.regionName || '日本精選');
        const safeDesc = (item.desc && item.desc !== 'undefined') ? item.desc : (safeSubtitle || '全日本精選四季情報，特派員現地親訪推薦。');

        // 情境專屬狀態標籤 (避免滑雪/露營出現櫻花滿開)
        let statusTagText = '';
        if (item.theme === 'snow') {
          statusTagText = item.snowDepth || item.species || '❄️ 天然粉雪積雪中';
        } else if (item.theme === 'camp') {
          statusTagText = item.siteStatus || item.viewRating || '⛺ 絕景露營席位';
        } else if (item.theme === 'wisteria') {
          statusTagText = item.bloomStatus || '💜 盛開見頃 (100%)';
        } else if (item.theme === 'nemophila') {
          statusTagText = item.bloomStatus || '🩵 盛開花海 (100%)';
        } else if (item.theme === 'hydrangea') {
          statusTagText = item.bloomStatus || '💠 見頃盛開 (100%)';
        } else if (item.theme === 'momiji') {
          statusTagText = item.bloomStatus || '🍁 見頃火紅 (100%)';
        } else if (item.theme === 'ginkgo') {
          statusTagText = item.bloomStatus || '🍂 純金見頃 (100%)';
        } else if (item.theme === 'lavender') {
          statusTagText = item.bloomStatus || '🪻 薰衣草見頃 (100%)';
        } else if (item.theme === 'shibazakura') {
          statusTagText = item.bloomStatus || '🌸 芝櫻地毯見頃 (100%)';
        } else if (item.theme === 'cosmos') {
          statusTagText = item.bloomStatus || '💮 波斯菊盛開 (100%)';
        } else if (item.theme === 'ume') {
          statusTagText = item.bloomStatus || '🌺 早春梅花見頃 (100%)';
        } else if (item.theme === 'sakura') {
          statusTagText = item.bloomStatus || '🌸 滿開 (100%)';
        } else {
          statusTagText = item.bloomStatus || '✨ 即時推薦';
        }

        // 情境專屬元數據 (避免露營/滑雪出現「櫻花品種：染井吉野櫻」)
        let metaRowContent = '';
        if (item.theme === 'snow') {
          metaRowContent = `
            <span class="meta-tag-pill">⛷️ 雪質：${item.species || '100% 天然輕粉雪 JAPOW'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '新幹線 / 巴士直達雪場'}</span>
          `;
        } else if (item.theme === 'camp') {
          metaRowContent = `
            <span class="meta-tag-pill">⛺ 營地：${item.campTypeInfo ? item.campTypeInfo.split('｜')[0].trim() : (item.siteStatus || '絕景露營')}</span>
            <span class="meta-tag-pill">🛣️ 交通：${item.navInfo || item.locationDetail || '自駕導航直達'}</span>
          `;
        } else if (item.theme === 'wisteria') {
          metaRowContent = `
            <span class="meta-tag-pill">💜 特色：${item.species || '樹齡160年奇蹟大藤'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '鄰近車站步行即達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#7E22CE; background:#FAF5FF; border-color:#E9D5FF;">${item.nightHours || '🏮 夜間紫藤光影點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'nemophila') {
          metaRowContent = `
            <span class="meta-tag-pill">🩵 特色：${item.species || '琉璃唐草530萬株純藍花毯'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '直達接駁巴士即達'}</span>
          `;
        } else if (item.theme === 'hydrangea') {
          metaRowContent = `
            <span class="meta-tag-pill">💠 特色：${item.species || '明月院藍姬繡球2,500株'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '古道步行即達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#6D28D9; background:#F5F3FF; border-color:#DDD6FE;">${item.nightHours || '🏮 夜間紫陽花點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'ginkgo') {
          metaRowContent = `
            <span class="meta-tag-pill">🍂 特色：${item.species || '300米純金大道・百年修剪並木'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '地鐵出站即達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#854D0E; background:#FEFCE8; border-color:#FEF08A;">${item.nightHours || '🏮 16:30 - 19:30 銀杏夜間彩燈'}</span>` : ''}
          `;
        } else if (item.theme === 'lavender') {
          metaRowContent = `
            <span class="meta-tag-pill">🪻 特色：${item.species || '濃紫早咲・丘陵紫色花毯'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || 'JR 富良野線直達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#6D28D9; background:#FAF5FF; border-color:#DDD6FE;">${item.nightHours || '🏮 夜間薰衣草光影點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'shibazakura') {
          metaRowContent = `
            <span class="meta-tag-pill">🌸 特色：${item.species || '粉紅・白・淡紫百萬株芝櫻花毯'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '直達接駁巴士即達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#BE185D; background:#FDF2F8; border-color:#FBCFE8;">${item.nightHours || '🏮 夜間芝櫻特別點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'cosmos') {
          metaRowContent = `
            <span class="meta-tag-pill">💮 特色：${item.species || '大波斯菊盛開・秋櫻黃金夕陽'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '公園入口步行即達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#B45309; background:#FEF3C7; border-color:#FDE68A;">${item.nightHours || '🏮 秋夜波斯菊點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'ume') {
          metaRowContent = `
            <span class="meta-tag-pill">🌺 特色：${item.species || '神木飛梅・極上白梅紅梅'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '神社參道步行即達'}</span>
            ${item.hasNightLight ? `<span class="meta-tag-pill" style="color:#BE123C; background:#FFF1F2; border-color:#FECDD3;">${item.nightHours || '🏮 夜梅特別點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'momiji') {
          metaRowContent = `
            <span class="meta-tag-pill">🍁 品種：${item.species || '伊呂波楓・山紅葉'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '鄰近車站步行即達'}</span>
            ${(isNight || item.hasNightLight) ? `<span class="meta-tag-pill spot-night-meta" style="color:#BE123C; background:#FFF1F2; border-color:#FDA4AF;">${item.nightHours || '🏮 17:00 - 20:30 夜間點燈'}</span>` : ''}
          `;
        } else if (item.theme === 'sakura') {
          metaRowContent = `
            <span class="meta-tag-pill">🌸 品種：${item.species || '染井吉野櫻'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '鄰近地鐵站步行即達'}</span>
            ${(isNight || item.hasNightLight) ? `<span class="meta-tag-pill spot-night-meta" style="color:#BE123C; background:#FFF1F2; border-color:#FDA4AF; display:${(isNight || item.hasNightLight) ? 'inline-flex' : 'none'};">${item.nightHours || '🏮 17:00 - 20:00 夜間點燈'}</span>` : ''}
          `;
        } else {
          metaRowContent = `
            <span class="meta-tag-pill">📍 特色：${item.species || safeSubtitle || '全日本精選絕景'}</span>
            <span class="meta-tag-pill">🚇 交通：${item.locationDetail || '鄰近車站步行即達'}</span>
          `;
        }

        const isNiseko = item.id === 'ski_niseko_united';
        const imgBoxHtml = isNiseko ? `
          <div class="card-img-box niseko-carousel-box" style="position:relative; overflow:hidden;">
            <div class="niseko-carousel-track" id="nisekoTrack" style="display:flex; width:400%; height:100%; transition:transform 0.5s ease-in-out;">
              <img src="./images/niseko_powder_skier.jpg" style="width:25%; height:100%; object-fit:cover;" alt="二世谷粉雪滑行">
              <img src="./images/niseko_yotei_slope.jpg" style="width:25%; height:100%; object-fit:cover;" alt="羊蹄山景觀雪道">
              <img src="./images/niseko_rhythm_rental.jpg" style="width:25%; height:100%; object-fit:cover;" alt="Rhythm 專業雪具租借">
              <img src="./images/niseko_resort_bus.jpg" style="width:25%; height:100%; object-fit:cover;" alt="度假村直通接駁巴士">
            </div>
            <div class="niseko-carousel-dots" style="position:absolute; bottom:12px; left:50%; transform:translateX(-50%); display:flex; gap:6px; z-index:3;">
              <span class="niseko-dot active" style="width:8px; height:8px; border-radius:50%; background:#fff; opacity:0.9; cursor:pointer;" onclick="setNisekoSlide(0); event.stopPropagation();"></span>
              <span class="niseko-dot" style="width:8px; height:8px; border-radius:50%; background:#fff; opacity:0.4; cursor:pointer;" onclick="setNisekoSlide(1); event.stopPropagation();"></span>
              <span class="niseko-dot" style="width:8px; height:8px; border-radius:50%; background:#fff; opacity:0.4; cursor:pointer;" onclick="setNisekoSlide(2); event.stopPropagation();"></span>
              <span class="niseko-dot" style="width:8px; height:8px; border-radius:50%; background:#fff; opacity:0.4; cursor:pointer;" onclick="setNisekoSlide(3); event.stopPropagation();"></span>
            </div>
            <button class="btn-card-fav ${isFav ? 'active' : ''}" data-fav-id="${item.id}" onclick="toggleFavorite('${item.id}', 'spot', '${safeTitle.replace(/'/g, "\\'")}', '${item.img}', '${item.region || ''}', '${safeTag}'); event.stopPropagation();" title="${isFav ? '已在收藏本' : '加入我的行程收藏'}">
              ${getHeartSvg(isFav, 12)}
            </button>
            <div class="card-region-badge">📍 ${safeTag}</div>
            <div class="card-bloom-status-tag" style="bottom:10px; top:auto; left:10px; right:auto;">${statusTagText}</div>
          </div>
        ` : `
          <div class="card-img-box">
            <img src="${activeCoverImg}" alt="${safeTitle}" loading="lazy" style="transition: opacity 0.25s ease;">
            <button class="btn-card-fav ${isFav ? 'active' : ''}" data-fav-id="${item.id}" onclick="toggleFavorite('${item.id}', 'spot', '${safeTitle.replace(/'/g, "\\'")}', '${item.img}', '${item.region || ''}', '${safeTag}'); event.stopPropagation();" title="${isFav ? '已在收藏本' : '加入我的行程收藏'}">
              ${getHeartSvg(isFav, 12)}
            </button>
            <!-- 🌟 地區在左上角 (小巧水平標籤) -->
            <div class="card-region-badge">📍 ${safeTag}</div>
            <div class="card-bloom-status-tag" style="bottom:10px; top:auto; left:10px; right:auto;">${statusTagText}</div>
            ${item.metrics && item.category === 'hanabi' ? `<div class="hanabi-spec-badge">🎆 ${item.metrics.depth}</div>` : ''}
          </div>
        `;

        card.innerHTML = `
          ${imgBoxHtml}
          <div class="card-body">
            <div class="card-title-header">
              <div>
                <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                  <h3 style="margin:0; font-size:1.1rem; font-weight:900; color:#1E293B;">${safeTitle}</h3>
                  ${verifyBadge}
                </div>
                ${safeSubtitle ? `<div class="card-subtitle-line" style="font-size:0.78rem; color:#64748B; margin:3px 0 6px;">${safeSubtitle}</div>` : ''}
              </div>
            </div>

            ${meguroNightCallout}

            <!-- 🌸 情境專屬元數據 (品種/雪質/營地 ＆ 交通資訊 ＆ 點燈時段) -->
            <div class="spot-meta-row">
              ${metaRowContent}
            </div>

            <p class="card-clean-concise-desc">${safeDesc}</p>

            <!-- ☕ 看櫻花/看楓葉喝咖啡推薦店家 (依使用者要求：醒目獨立呼叫盒、明顯文字) -->
            ${item.sakuraCafe ? `
              <div class="spot-cafe-recommend-box" style="background:linear-gradient(135deg, #FFF5F7 0%, #FDF2F4 100%); border:1.5px solid #FBCFE8; border-radius:10px; padding:10px 14px; margin:10px 0 12px; display:flex; align-items:flex-start; gap:10px; box-shadow:0 2px 8px rgba(244,114,182,0.08);">
                <img src="./images/icon_cafe.png" alt="cafe" style="width:28px; height:28px; object-fit:contain; flex-shrink:0; margin-top:2px;">
                <div style="flex:1;">
                  <div style="font-size:0.75rem; font-weight:800; letter-spacing:0.06em; color:#BE185D; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
                    <span>🌸 看櫻花喝咖啡推薦店家</span>
                    <span style="background:#FCE7F3; color:#9D174D; font-size:0.68rem; padding:1px 6px; border-radius:4px; font-weight:700;">步行即達</span>
                  </div>
                  <div style="font-family:'Shippori Mincho', 'Noto Serif TC', serif; font-size:1.02rem; font-weight:900; color:#0F172A; letter-spacing:-0.01em; line-height:1.35; margin-bottom:2px;">
                    ${item.sakuraCafe.name}
                  </div>
                  <div style="font-size:0.78rem; color:#475569; line-height:1.5;">
                    ${item.sakuraCafe.feature}
                  </div>
                </div>
              </div>
            ` : ''}

            ${item.momijiCafe ? `
              <div class="spot-cafe-recommend-box" style="background:linear-gradient(135deg, #FAF6F0 0%, #F5EFEB 100%); border:1.5px solid #D7C4B7; border-radius:10px; padding:10px 14px; margin:10px 0 12px; display:flex; align-items:flex-start; gap:10px; box-shadow:0 2px 8px rgba(120,53,15,0.06);">
                <img src="./images/icon_cafe.png" alt="cafe" style="width:28px; height:28px; object-fit:contain; flex-shrink:0; margin-top:2px;">
                <div style="flex:1;">
                  <div style="font-size:0.75rem; font-weight:800; letter-spacing:0.06em; color:#92400E; margin-bottom:3px; display:flex; align-items:center; gap:6px;">
                    <span>🍁 看楓葉喝咖啡推薦店家</span>
                    <span style="background:#EFE7DE; color:#78350F; font-size:0.68rem; padding:1px 6px; border-radius:4px; font-weight:700;">楓景名座</span>
                  </div>
                  <div style="font-family:'Shippori Mincho', 'Noto Serif TC', serif; font-size:1.02rem; font-weight:900; color:#0F172A; letter-spacing:-0.01em; line-height:1.35; margin-bottom:2px;">
                    ${item.momijiCafe.name}
                  </div>
                  <div style="font-size:0.78rem; color:#475569; line-height:1.5;">
                    ${item.momijiCafe.feature}
                  </div>
                </div>
              </div>
            ` : ''}

            ${(item.theme === 'snow') ? `
              <!-- ⛷️ 極上粉雪 現代極簡雜誌風指標卡片 (去除刺眼廣告感、無多餘emoji、呼吸感充沛) -->
              <div class="snow-card-matrix">
                <!-- 1. 雪場即時狀態列 (極簡淨白標籤) -->
                <div class="snow-top-status-bar">
                  <span class="snow-status-loc">${item.tag || item.regionName || '日本雪場'}</span>
                  <span class="snow-status-quality">JAPOW 乾粉雪</span>
                  <span class="snow-status-time">${item.testedTime ? item.testedTime.replace('🟢', '').trim() : '07:30 實測'}</span>
                </div>

                <!-- 2. 三大核心即時數值 (大字清晰、呼吸感排版) -->
                <div class="snow-live-metrics-grid">
                  <div class="snow-metric-box">
                    <span class="snow-metric-label">積雪深度</span>
                    <span class="snow-metric-val">${item.snowDepth ? item.snowDepth.replace('山頂', '').split('/')[0].trim() : '290cm'}</span>
                  </div>
                  <div class="snow-metric-box">
                    <span class="snow-metric-label">24h 新雪</span>
                    <span class="snow-metric-val highlight-fresh">${item.newSnow24h || '+25cm'}</span>
                  </div>
                  <div class="snow-metric-box">
                    <span class="snow-metric-label">纜車運行</span>
                    <span class="snow-metric-val">${item.liftsRunning ? item.liftsRunning.replace('條運行', '').trim() : '全線開'}</span>
                  </div>
                </div>

                <!-- 3. 雪道難度比例條 (日系沉穩三色，無冗餘圖示) -->
                <div class="snow-slope-ratio-wrap">
                  <div class="snow-slope-ratio-bar">
                    <div class="slope-seg slope-green" style="width: ${item.slopeRatio ? item.slopeRatio.green : 30}%" title="初級 ${item.slopeRatio ? item.slopeRatio.green : 30}%"></div>
                    <div class="slope-seg slope-yellow" style="width: ${item.slopeRatio ? item.slopeRatio.yellow : 50}%" title="中級 ${item.slopeRatio ? item.slopeRatio.yellow : 50}%"></div>
                    <div class="slope-seg slope-red" style="width: ${item.slopeRatio ? item.slopeRatio.red : 20}%" title="高級 ${item.slopeRatio ? item.slopeRatio.red : 20}%"></div>
                  </div>
                  <div class="snow-slope-ratio-labels">
                    <span class="lbl-green">初級 ${item.slopeRatio ? item.slopeRatio.green : 30}%</span>
                    <span class="lbl-yellow">中級 ${item.slopeRatio ? item.slopeRatio.yellow : 50}%</span>
                    <span class="lbl-red">高級 ${item.slopeRatio ? item.slopeRatio.red : 20}%</span>
                  </div>
                </div>

                <!-- 4. 地形特色要點 (兩欄極簡膠囊) -->
                <div class="snow-terrain-specs-grid">
                  <div class="snow-terrain-cell">
                    <span class="snow-terrain-lbl">初學友好</span>
                    <span class="snow-terrain-val">${item.magicCarpet ? '魔毯輸送帶' : '緩坡吊椅'} ｜ ${item.wideSlope ? item.wideSlope.replace(/<[^>]+>/g, '').split('(')[0].trim() : '寬敞緩坡'}</span>
                  </div>
                  <div class="snow-terrain-cell">
                    <span class="snow-terrain-lbl">老手野雪</span>
                    <span class="snow-terrain-val">標高差 ${item.verticalDrop || '1,000m'} ｜ ${item.treeRun ? '樹林野雪' : '長距巡航'}</span>
                  </div>
                </div>

                <!-- 4.5 二世谷專屬頂級服務卡片群 (中文私教、Rhythm裝備、全山纜車通票、機場直達巴士) -->
                ${isNiseko ? `
                  <div class="niseko-packages-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin: 12px 0 6px;">
                    <a href="https://www.klook.com/zh-TW/activity/13248-niseko-private-ski-snowboard-lesson-hokkaido/?aid=123436&utm_medium=affiliate-alwayson" target="_blank" class="niseko-pkg-card" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; text-decoration:none; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s;" onmouseover="this.style.borderColor='#38BDF8'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.transform='none';" onclick="event.stopPropagation();">
                      <div style="font-size:0.75rem; font-weight:800; color:#0F172A;">⛷️ 中文私教 1對1/小班</div>
                      <div style="font-size:0.72rem; color:#64748B; margin:2px 0;">全中文溝通・初學野雪通修</div>
                      <div style="font-size:0.8rem; font-weight:800; color:#0284C7; margin-top:2px;">NT$ 6,588 <small style="font-size:0.65rem; color:#94A3B8;">起 ↗</small></div>
                    </a>
                    <a href="https://www.klook.com/zh-TW/activity/9167-niseko-ski-snowboard-rental-hokkaido/?aid=123436&utm_medium=affiliate-alwayson" target="_blank" class="niseko-pkg-card" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; text-decoration:none; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s;" onmouseover="this.style.borderColor='#38BDF8'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.transform='none';" onclick="event.stopPropagation();">
                      <div style="font-size:0.75rem; font-weight:800; color:#0F172A;">🎿 Rhythm 頂級裝備租借</div>
                      <div style="font-size:0.72rem; color:#64748B; margin:2px 0;">粉雪板・雪靴・防寒雪衣</div>
                      <div style="font-size:0.8rem; font-weight:800; color:#0284C7; margin-top:2px;">NT$ 3,181 <small style="font-size:0.65rem; color:#94A3B8;">起 ↗</small></div>
                    </a>
                    <a href="https://www.klook.com/zh-TW/activity/2856-niseko-lift-pass-bus-transfer-hokkaido/?aid=123436&utm_medium=affiliate-alwayson" target="_blank" class="niseko-pkg-card" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; text-decoration:none; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s;" onmouseover="this.style.borderColor='#38BDF8'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.transform='none';" onclick="event.stopPropagation();">
                      <div style="font-size:0.75rem; font-weight:800; color:#0F172A;">🎟️ 全山纜車通票＋巴士</div>
                      <div style="font-size:0.72rem; color:#64748B; margin:2px 0;">四大雪場暢滑・札幌來回</div>
                      <div style="font-size:0.8rem; font-weight:800; color:#0284C7; margin-top:2px;">NT$ 4,449 <small style="font-size:0.65rem; color:#94A3B8;">起 ↗</small></div>
                    </a>
                    <a href="https://www.klook.com/zh-TW/activity/6797-new-chitose-airport-niseko-bus-transfer-hokkaido/?aid=123436&utm_medium=affiliate-alwayson" target="_blank" class="niseko-pkg-card" style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:8px 10px; text-decoration:none; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s;" onmouseover="this.style.borderColor='#38BDF8'; this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.transform='none';" onclick="event.stopPropagation();">
                      <div style="font-size:0.75rem; font-weight:800; color:#0F172A;">🚌 新千歲機場直達巴士</div>
                      <div style="font-size:0.72rem; color:#64748B; margin:2px 0;">免轉車扛雪具・度假村直達</div>
                      <div style="font-size:0.8rem; font-weight:800; color:#0284C7; margin-top:2px;">NT$ 1,240 <small style="font-size:0.65rem; color:#94A3B8;">起 ↗</small></div>
                    </a>
                  </div>
                ` : ''}

                <!-- 5. 官方與LiveCam快捷連結 (極簡文字連結) -->
                <div class="snow-clean-links-row">
                  <a href="${item.officialUrl || '#'}" target="_blank" class="snow-clean-link" onclick="event.stopPropagation();">
                    雪場官網 ↗
                  </a>
                  <a href="${item.liveCamUrl || '#'}" target="_blank" class="snow-clean-link" onclick="event.stopPropagation();">
                    即時 LiveCam ↗
                  </a>
                  <a href="${item.rentalUrl || ('https://www.klook.com/zh-TW/search/result/?query=&aid=123436&utm_medium=affiliate-alwayson' + encodeURIComponent(item.title + ' 雪具租借') + '&aid=123436&utm_medium=affiliate-alwayson')}" target="_blank" class="snow-clean-link" onclick="event.stopPropagation();">
                    裝備租賃 ↗
                  </a>
                </div>

                <!-- 6. 折疊抽屜按鈕 (極簡淡雅邊框膠囊，預設折疊) -->
                <div class="snow-drawer-toggles-row">
                  <button type="button" class="btn-snow-drawer-toggle" onclick="toggleSnowDrawer('${item.id}', 'onsen', this); event.stopPropagation();">
                    <span>雪見溫泉 ▾</span>
                  </button>
                  <button type="button" class="btn-snow-drawer-toggle" onclick="toggleSnowDrawer('${item.id}', 'safety', this); event.stopPropagation();">
                    <span>醫療救護 ▾</span>
                  </button>
                </div>

                <!-- 溫泉折疊抽屜內容 (預設折疊隱藏) -->
                <div class="snow-drawer-panel" id="snowOnsen_${item.id}">
                  <div class="snow-drawer-title">滑雪舒緩・周邊雪見名湯</div>
                  ${item.hotspringsHtml || `
                    <div class="snow-drawer-item">
                      <b>雪場直通天然溫泉：</b>弱鹼性泉質，有效舒緩腿部肌肉痠痛與肩膀疲勞。
                    </div>
                  `}
                </div>

                <!-- 安全急診折疊抽屜內容 (預設折疊隱藏) -->
                <div class="snow-drawer-panel" id="snowSafety_${item.id}">
                  <div class="snow-drawer-title">安全救援 ＆ 海外醫療指南</div>
                  <div class="snow-drawer-item">
                    <b>雪場巡邏隊：</b>${item.patrolPhone || '雪場直撥內線 110 或至各纜車站通報救援'}
                  </div>
                  <div class="snow-drawer-item">
                    <b>外傷骨科診所：</b>${item.orthopedicClinic || '具備 X 光與英語接診應對能力'}
                  </div>
                  <div class="snow-drawer-item snow-insurance-tip">
                    <b>保險理賠提醒：</b>受傷就醫務必索取<b>「診斷證明書」</b>與<b>「收據明細正本」</b>，以利回國申請理賠。
                  </div>
                </div>
              </div>
            ` : (item.theme === 'camp') ? `
              <!-- ⛺ 露營自駕專屬四大關鍵指標 (取代品種與花況) -->
              <div class="camp-specs-grid">
                <div class="camp-spec-cell">
                  <span class="camp-spec-lbl">⛺ 營位類型</span>
                  <span class="camp-spec-val">${item.campTypeInfo || 'Auto Camp 車輛直達搭帳'}</span>
                </div>
                <div class="camp-spec-cell">
                  <span class="camp-spec-lbl">🚿 設施評級</span>
                  <span class="camp-spec-val">${item.facilitiesInfo || '24h 溫水衛浴 ｜ 焚火可 ｜ 景觀咖啡'}</span>
                </div>
                <div class="camp-spec-cell">
                  <span class="camp-spec-lbl">🚗 車型建議</span>
                  <span class="camp-spec-val">${item.vehicleInfo || '建議 4WD 四驅車款防滑'}</span>
                </div>
                <div class="camp-spec-cell">
                  <span class="camp-spec-lbl">🛣️ 自駕導航</span>
                  <span class="camp-spec-val">${item.navInfo || '高速公路交流道直達'}</span>
                </div>
              </div>

              <!-- 💡 特派員自駕避坑筆記 -->
              <div class="camp-tips-box">
                <b>💡 特派員避坑筆記：</b><br>
                ${(item.proTips || '• 湖畔搭帳需備 30cm 鍛造長營釘抗山風；清晨儘早進場選位。').replace(/\n/g, '<br>')}
              </div>

              <!-- 4 顆高轉換推薦按鈕組合 (嚴格零分潤字樣、零Klook字樣) -->
              <div class="camp-actions-group">
                <div class="camp-actions-row-top">
                  <a href="${item.bookingUrl || 'https://www.booking.com/'}" target="_blank" class="btn-camp-primary" onclick="event.stopPropagation();" title="預約營位或豪華露營住宿">
                    <span>預約營位</span>
                  </a>
                  <a href="${item.rentalUrl || 'https://www.klook.com/zh-TW/search/result/?query=%E6%97%A5%E6%9C%AC%E7%A7%9F%E8%BB%8A&aid=123436&utm_medium=affiliate-alwayson'}" target="_blank" class="btn-camp-rental" onclick="event.stopPropagation();" title="全日本自駕租車比價・中文GPS・含免責補償">
                    <span>租車比價</span>
                  </a>
                </div>
                <a href="${item.charterUrl || 'https://www.klook.com/zh-TW/search/result/?query=%E6%97%A5%E6%9C%AC%E5%8C%85%E8%BB%8A&aid=123436&utm_medium=affiliate-alwayson'}" target="_blank" class="btn-camp-charter" onclick="event.stopPropagation();" title="私人專屬中文司機包車一日遊">
                  <span>包車接駁</span>
                </a>
                <button type="button" class="btn-camp-qa-toggle" onclick="toggleCampQa('${item.id}', this); event.stopPropagation();">
                  <span>自駕須知 ▾</span>
                </button>
                <div class="camp-qa-accordion-panel" id="campQa_${item.id}">
                  <b>【外國人自駕露營防踩雷須知】</b><br>
                  • <b>駕照必備</b>：台灣旅客必須備妥「台灣駕照正本 ＋ 日文譯本 ＋ 護照」（國際駕照無效）。<br>
                  • <b>車宿規定</b>：不可在一般超商停車場過夜，必須停靠合法的 RV Park 或汽車露營場。<br>
                  • <b>車高限制</b>：露營車高度達 2.8～3.1m，嚴禁進入市區立體或地下機械停車場。<br>
                  • <b>冬季防滑</b>：冬季山區行駛（12月~4月）租車請務必勾選「Studless 雪胎」。
                </div>
              </div>
            ` : `
            <!-- 🌟 名所卡片微型膠囊切換器 (預設美食日料，自由切換住宿) -->
            <div class="spot-pills-switcher">
              <button class="spot-switch-pill active" id="tabBtn_${item.id}_food" onclick="switchSpotCardTab('${item.id}', 'food', this); event.stopPropagation();">
                <span>美食日料</span>
              </button>
              <button class="spot-switch-pill" id="tabBtn_${item.id}_stay" onclick="switchSpotCardTab('${item.id}', 'stay', this); event.stopPropagation();">
                <span>推薦住宿</span>
              </button>
            </div>

            <!-- 切換顯示內容容器 (預設：美食日料) -->
            <div class="spot-tab-content-panel" id="tabPane_${item.id}">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div class="spot-nav-food-row" onclick="openGoogleNavModal('${encodeURIComponent(japanFoodName)}', '${encodeURIComponent(item.title)}'); event.stopPropagation();" title="點擊規劃導航路線" style="cursor:pointer; padding:6px 4px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s;">
                  <div style="color:#1E293B; font-weight:700; font-size:0.75rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    日料推薦：${japanFoodName}
                  </div>
                  <span style="color:#94A3B8; font-size:0.95rem; font-weight:600; margin-left:8px; line-height:1;">›</span>
                </div>
                <div class="spot-nav-cafe-row" onclick="openGoogleNavModal('${encodeURIComponent(cafeName)}', '${encodeURIComponent(item.title)}'); event.stopPropagation();" title="點擊規劃導航路線" style="cursor:pointer; padding:6px 4px; display:flex; align-items:center; justify-content:space-between; transition:all 0.2s; border-top:1px solid #F1F5F9;">
                  <div style="flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <span style="color:#1E293B; font-weight:700; font-size:0.75rem;">景觀咖啡：${cafeName}</span>
                    <span style="color:#64748B; font-size:0.7rem; margin-left:6px;">${cafeFeature}</span>
                  </div>
                  <span style="color:#94A3B8; font-size:0.95rem; font-weight:600; margin-left:8px; line-height:1;">›</span>
                </div>
              </div>
            </div>
            `}

            <!-- 底部操作按鈕列 (精簡 4 字以內、一行三鍵絕不折行、淡雅日系和風配色) -->
            ${(item.theme === 'camp') ? '' : (item.theme === 'snow') ? `
              <div class="card-action-bar ski-action-bar">
                <a href="${item.coachUrl || ('https://www.klook.com/zh-TW/search/result/?query=&aid=123436&utm_medium=affiliate-alwayson' + encodeURIComponent(item.title + ' 滑雪教練') + '&aid=123436&utm_medium=affiliate-alwayson')}" target="_blank" class="btn-act-clean btn-act-primary" title="預約該雪場認證專業中文教練" onclick="event.stopPropagation();">
                  <span>預約教練</span>
                </a>
                <a href="${item.hotelUrl || ('https://www.booking.com/searchresults.zh-tw.html?ss=' + encodeURIComponent(item.title) + '&aid=2422002')}" target="_blank" class="btn-act-clean btn-act-secondary" title="預訂雪場周邊飯店與溫泉旅館" onclick="event.stopPropagation();">
                  <span>雪場住宿</span>
                </a>
                <a href="${item.charterUrl || ('https://www.klook.com/zh-TW/search/result/?query=&aid=123436&utm_medium=affiliate-alwayson' + encodeURIComponent((item.regionName || item.tag || '日本') + ' 滑雪包車') + '&aid=123436&utm_medium=affiliate-alwayson')}" target="_blank" class="btn-act-clean btn-act-tertiary" title="預約機場/市區直達雪場包車" onclick="event.stopPropagation();">
                  <span>專車包車</span>
                </a>
              </div>
            ` : (item.category === 'hanabi' || item.theme === 'hanabi') ? `
              <div class="card-action-bar hanabi-action-bar">
                <a href="${item.yukataUrl || 'https://www.klook.com/zh-TW/search/result/?query=%E6%B5%B4%E8%A1%A3%E9%AB%94%E9%A9%97&aid=123436&utm_medium=affiliate-alwayson'}" target="_blank" class="btn-act-clean btn-act-secondary" title="預約浴衣" onclick="event.stopPropagation();">
                  <span>浴衣體驗</span>
                </a>
                <a href="${item.houseboatUrl || klookFinalUrl}" target="_blank" class="btn-act-clean btn-act-primary" title="預約觀覽席或屋形船" onclick="event.stopPropagation();">
                  <span>觀覽席票</span>
                </a>
                <a href="${bookingFinalUrl}" target="_blank" class="btn-act-clean btn-act-secondary" title="預約周邊住宿" onclick="event.stopPropagation();">
                  <span>查看訂房</span>
                </a>
              </div>
            ` : `
              <div class="card-action-bar">
                <a href="${klookFinalUrl}" target="_blank" class="btn-act-clean btn-act-primary" onclick="event.stopPropagation();">
                  <span>${isNightMomiji ? '夜間門票' : '預約門票'}</span>
                </a>
                <a href="${bookingFinalUrl}" target="_blank" class="btn-act-clean btn-act-secondary" onclick="event.stopPropagation();">
                  <span>查看訂房</span>
                </a>
                <a href="${item.charterUrl || 'japan_charter_rental.html'}" target="_blank" class="btn-act-clean btn-act-tertiary" onclick="event.stopPropagation();" title="包車一日遊直達景點">
                  <span>包車直達</span>
                </a>
              </div>
            `}
          </div>
        `;
        container.appendChild(card);
      });
      startNisekoCarousel();
    }

    // 動態依季節配置上傳 Modal 景點與現況選項
    let SEASON_UPLOAD_CONFIG = {};

    function openUploadModal() {
      const cfg = SEASON_UPLOAD_CONFIG[currentSeason] || SEASON_UPLOAD_CONFIG['sakura'];

      const modalTitleEl = document.getElementById('uploadModalTitle');
      if (modalTitleEl) modalTitleEl.innerText = cfg.modalTitle;

      const spotSelect = document.getElementById('uploadSpot');
      if (spotSelect) {
        spotSelect.innerHTML = cfg.spots.map(s => `<option value="${s.val}">${s.label}</option>`).join('');
      }

      const bloomSelect = document.getElementById('uploadBloom');
      if (bloomSelect) {
        bloomSelect.innerHTML = cfg.statuses.map(st => `<option value="${st}">${st}</option>`).join('');
      }

      const commentEl = document.getElementById('uploadComment');
      if (commentEl) {
        commentEl.placeholder = cfg.defaultComment;
      }

      document.getElementById('mainScrim').classList.add('show');
      document.getElementById('uploadModal').classList.add('show');
    }

    function closeUploadModal() {
      document.getElementById('uploadModal').classList.remove('show');
      document.getElementById('mainScrim').classList.remove('show');
    }

    function submitUserReport() {
      const cfg = SEASON_UPLOAD_CONFIG[currentSeason] || SEASON_UPLOAD_CONFIG['sakura'];
      const spot = document.getElementById('uploadSpot').value;
      const bloom = document.getElementById('uploadBloom').value;
      const commentInput = document.getElementById('uploadComment').value.trim();
      const comment = commentInput || cfg.defaultComment;

      const newFeed = {
        id: 'user_' + Date.now(),
        season: currentSeason === 'spots' ? 'sakura' : currentSeason,
        user: `${cfg.userPrefix}・現場連線`,
        spot: spot,
        time: '昨天剛剛實拍',
        bloom: bloom,
        comment: comment,
        img: cfg.img
      };

      COMMUNITY_FEEDS.unshift(newFeed);
      renderCommunityFeeds();
      closeUploadModal();
      alert(`感謝你的熱心回報！已即刻發佈至【${I18N[currentLang]?.[`feed_${currentSeason}_title`] || '現場實況看板'}】，幫助更多旅人掌握最新情報！`);
    }

    function openReadingSheet(id) {
      const item = SPOTS_DATABASE.find(s => s.id === id);
      if (!item || !item.report) return;

      const r = item.report;
      const sheet = document.getElementById('readingSheet');
      const container = document.getElementById('sheetContent');

      let pitfallsHtml = '';
      if (r.pitfalls) {
        pitfallsHtml = `
          <div style="background:#F9F4EE; border:1px dashed #C29B7F; border-radius:14px; padding:15px; margin:18px 0;">
            <div style="font-size:0.88rem; font-weight:900; color:#BD8C6B; margin-bottom:8px;">⚠️ 站長現場實測避雷指南</div>
            <ul style="list-style:none; display:flex; flex-direction:column; gap:6px;">
              ${r.pitfalls.map(p => `<li style="font-size:0.8rem; color:#78716C; line-height:1.5;">・${p}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      container.innerHTML = `
        <div style="border-bottom:1px dashed var(--border-morandi); padding-bottom:14px; margin-bottom:16px;">
          <span style="background:#FFF1F5; color:#E11D48; border:1.5px solid #FDA4AF; font-size:0.72rem; font-weight:800; padding:2px 8px; border-radius:6px;">
            ${r.stampDate} 特派員實地報導
          </span>
          <h2 style="font-family:var(--font-serif); font-size:1.4rem; font-weight:900; line-height:1.4; margin-top:8px; color:#1E293B;">
            ${r.headline}
          </h2>
          <div style="display:flex; gap:8px; font-size:0.72rem; color:#718096; font-weight:600; margin-top:6px; flex-wrap:wrap;">
            <span>✍️ ${r.author}</span>
            <span>📅 ${r.date}</span>
            <span>⛅ ${r.weather}</span>
            <span>📷 ${r.camera}</span>
          </div>
        </div>

        <div style="border-radius:14px; overflow:hidden; margin-bottom:18px; box-shadow:0 4px 14px rgba(0,0,0,0.04);">
          <img src="${item.img}" style="width:100%; height:260px; object-fit:cover; display:block;">
        </div>

        <div style="background:#FFF; border-left:3.5px solid #E11D48; padding:12px 16px; border-radius:0 10px 10px 0; font-size:0.88rem; line-height:1.8; color:#334155; margin-bottom:18px; font-weight:600; box-shadow:0 2px 8px rgba(225,29,72,0.05);">
          ${r.lead}
        </div>

        ${pitfallsHtml}

        <!-- 🏅 官方特約觀測現地取材認證標章 -->
        <div class="official-verify-badge-stamp">
          <div style="font-size:26px;">🏅</div>
          <div>
            <div style="font-weight:900; font-size:0.88rem; color:#78350F;">日旅報報 官方特約觀測現地取材認證</div>
            <div style="font-size:0.75rem; color:#92400E; margin-top:3px; line-height:1.5;">
              本文情報經現地特派員實地走訪校驗｜嚴禁未經授權爬蟲搬運、AI 仿製與商業轉載。
            </div>
          </div>
        </div>

        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:22px;">
          <button onclick="toggleFavorite('${item.id}', 'spot', '${item.title.replace(/'/g, "\\'")}', '${item.img}', '${item.region || ''}', '${item.tag || ''}');" style="background:#FFF1F2; border:1.5px solid #FDA4AF; color:#BE123C; padding:10px 18px; border-radius:12px; font-size:0.82rem; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
            ❤️ 收藏此景點至排程本
          </button>
          <button onclick="window.open('https://www.google.com/maps', '_blank')" style="background:#2D3748; color:#FFF; border:none; padding:10px 18px; border-radius:12px; font-size:0.82rem; font-weight:800; cursor:pointer;">
            🗺️ 開啟 Google Maps 站長私房機位導航
          </button>
        </div>

        <!-- 🌸 深度特派員手記結尾：日旅報報 編集室の言葉 (EDITORIAL COLOPHON & SEASONAL MANIFESTO) -->
        <div style="margin:28px 0 12px; padding:24px 20px; background:#FAF8F5; border:1px solid #EADBCE; border-radius:14px; display:flex; flex-direction:column; gap:16px;">
          <div style="display:flex; align-items:center; gap:14px; border-bottom:1px solid #E2E8F0; padding-bottom:16px;">
            <div style="width:52px; height:52px; border-radius:50%; overflow:hidden; background:#FFF; border:1px solid #E2E8F0; flex-shrink:0;">
              <img src="./images/japan_tabi_logo.png" alt="JAPAN TABI" style="width:100%; height:100%; object-fit:cover;">
            </div>
            <div>
              <div style="font-size:0.6rem; font-weight:800; letter-spacing:2px; color:#92400E; text-transform:uppercase;">EDITORIAL COLOPHON</div>
              <div style="font-family:'Cormorant Garamond', serif; font-size:1.15rem; font-weight:700; color:#111827; letter-spacing:1px;">JAPAN TABI</div>
              <div style="font-size:0.75rem; color:#475569; font-weight:700; letter-spacing:1px;">日旅報報 編集部 ｜ ジャパン・タビ 編集室</div>
            </div>
          </div>
          <div>
            <div style="font-size:0.65rem; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:#92400E; margin-bottom:6px;">SEASONAL MANIFESTO ｜ 編集室の言葉</div>
            <div style="font-family:'Shippori Mincho', 'Noto Serif TC', serif; font-size:1.2rem; font-weight:800; color:#111827; line-height:1.4; margin-bottom:6px;">四季流轉，在日本的風物裡遇見彼此</div>
            <div style="font-size:0.8rem; color:#64748B; margin-bottom:12px;">移ろいゆく季節の中で、本当の自分を見つける静かな旅へ。</div>
            <p style="font-family:'Shippori Mincho', 'Noto Serif TC', serif; font-size:0.88rem; color:#334155; line-height:1.9; margin:0 0 10px;">
              「春櫻浮水、深冬落雪。我們出發，只為記下日本每一次光影與心跳。在天地盛開與枯榮之間，讓腳步慢下來，遇見最初的自己。」
            </p>
            <div style="font-family:'Cormorant Garamond', serif; font-size:0.95rem; font-style:italic; color:#78350F; font-weight:600;">“Encountering Japan with you, one quiet season at a time.”</div>
          </div>
        </div>
      `;

      document.getElementById('mainScrim').classList.add('show');
      sheet.classList.add('show');
    }


    // 專題獨立全屏頁面控制
    function openTrainPortal() {
      document.getElementById('trainTopicModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeTrainPortal() {
      document.getElementById('trainTopicModal').classList.remove('show');
      document.body.style.overflow = '';
    }

    function openSportsPortal() {
      document.getElementById('sportsTopicModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeSportsPortal() {
      document.getElementById('sportsTopicModal').classList.remove('show');
      document.body.style.overflow = '';
    }

    function openCharterRentalPortal() {
      document.getElementById('charterRentalModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeCharterRentalPortal() {
      document.getElementById('charterRentalModal').classList.remove('show');
      document.body.style.overflow = '';
    }
    function switchToCharterRental() {
      closeCampPortal();
      openCharterRentalPortal();
    }
    function switchToCampPortal() {
      closeCharterRentalPortal();
      openCampPortal();
    }

    function openCampPortal() {
      document.getElementById('campTopicModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeCampPortal() {
      document.getElementById('campTopicModal').classList.remove('show');
      document.body.style.overflow = '';
    }

    function openAcgPortal() {
      document.getElementById('acgTopicModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeAcgPortal() {
      document.getElementById('acgTopicModal').classList.remove('show');
      document.body.style.overflow = '';
    }

    function scrollToArticle(articleId) {
      const el = document.getElementById(articleId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }


    // ⛺ 露營分區過濾控制

    // ⛺ 營地即時關鍵字搜尋 (地區、名稱、標籤)

    // 🚂 鐵道路線即時分區過濾

    // 🚆 列車深度資料集與互動彈窗控制
    let TRAINS_DATABASE = [];

    function openTrainDetail(trainId) {
      const train = TRAINS_DATABASE.find(t => t.id === trainId);
      if (!train) return;
      const modal = document.getElementById('trainDetailModal');
      const body = document.getElementById('trainDetailBody');

      // 對應分區直飛主要機場與熱門飯店城市
      const flightRegionMap = {
        'kyushu': { dest: 'fukuoka', airport: '福岡/熊本', city: '福岡' },
        'kanto': { dest: 'tokyo', airport: '東京 (羽田/成田)', city: '東京' },
        'kansai': { dest: 'osaka', airport: '大阪關西', city: '京都' },
        'tohoku': { dest: 'sendai', airport: '東北仙台', city: '仙台' },
        'hokkaido': { dest: 'sapporo', airport: '北海道新千歲', city: '札幌' },
        'chugoku_shikoku': { dest: 'hiroshima', airport: '廣島/高松', city: '廣島' }
      };
      const flightInfo = flightRegionMap[train.route_category] || { dest: 'tokyo', airport: '東京', city: '東京' };
      const endStation = train.stations && train.stations.length > 0 ? train.stations[train.stations.length - 1] : flightInfo.city;

      let stationsHtml = train.stations.map((s, idx) => `
        <span style="display:inline-flex; align-items:center; gap:6px; font-size:0.82rem; font-weight:800; color:#1E293B;">
          ${idx > 0 ? '<span style="color:#CBD5E1;">➔</span>' : ''}
          <span style="background:#FFF; border:1px solid #CBD5E1; padding:4px 10px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">${s}</span>
        </span>
      `).join(' ');

      let itineraryHtml = train.itinerary.map(item => `
        <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:12px 16px; display:flex; gap:12px; align-items:flex-start;">
          <span style="font-size:1.15rem; line-height:1; flex-shrink:0; margin-top:2px;">📍</span>
          <div style="flex:1;">
            <div style="font-size:0.92rem; font-weight:900; color:#1E293B;">${item.title}</div>
            <div style="font-size:0.82rem; color:#64748B; margin-top:4px; line-height:1.5;">${item.desc}</div>
          </div>
        </div>
      `).join('');

      let highlightsHtml = train.highlights.map(h => `
        <li style="margin-bottom:8px; font-size:0.85rem; color:#334155; line-height:1.5;">${h}</li>
      `).join('');

      const isTrainFav = isFavorite(train.id);
      body.innerHTML = `
        <!-- 頂部標籤與路線 -->
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:10px; flex-wrap:wrap;">
          <span style="background:${train.tag_color}; color:#FFF; font-size:0.75rem; font-weight:900; padding:4px 12px; border-radius:6px;">${train.operator}</span>
          <span style="font-size:0.82rem; color:#64748B; font-weight:800;">${train.section} ｜ ${train.time}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:16px; flex-wrap:wrap;">
          <h2 style="font-size:1.65rem; font-weight:900; color:#0F172A; margin:0;">${train.name}</h2>
          <button id="trainFavBtn_${train.id}" onclick="toggleFavorite('${train.id}', 'train', '${train.name.replace(/'/g, "\\'")}', '${train.image}', '${train.route_category}', '${train.badge}'); updateTrainDetailFavBtn('${train.id}');" style="flex-shrink:0; background:${isTrainFav ? '#FFF1F2' : '#FFF'}; border:1.5px solid ${isTrainFav ? '#FDA4AF' : '#E2E8F0'}; color:${isTrainFav ? '#BE123C' : '#475569'}; padding:7px 14px; border-radius:10px; font-weight:900; font-size:0.8rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s;">
            <span>${isTrainFav ? '❤️ 已在我的收藏本' : '🤍 收藏此觀光列車'}</span>
          </button>
        </div>
        
        <!-- 列車首圖 -->
        <div style="border-radius:16px; overflow:hidden; height:320px; margin-bottom:20px; box-shadow:0 6px 20px rgba(0,0,0,0.08);">
          <img src="${train.image}" style="width:100%; height:100%; object-fit:cover;" alt="${train.name}">
        </div>

        <!-- 🎯 Trip.com 30天分潤鎖定 ＆ 全方位快捷預訂條 (車票 ＋ 機票 ＋ 飯店) -->
        <div style="background:linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%); border:1.5px solid #BAE6FD; border-radius:14px; padding:16px 18px; margin-bottom:24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:900; color:#0369A1;">
              <span>🎁</span> <span>Trip.com 官方合作夥伴 ｜ 點擊立即啟用 30 天早鳥最低價鎖定 ＆ 飯店 5.5% 專屬回饋</span>
            </div>
            <span style="font-size:0.7rem; background:#DBEAFE; color:#1E40AF; padding:2px 8px; border-radius:4px; font-weight:800;">30-Day Cookie Active</span>
          </div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button onclick="window.open('${train.ticket_url}', '_blank')" style="flex:1; min-width:160px; background:#059669; color:#FFF; font-weight:900; border:none; padding:11px 16px; border-radius:10px; font-size:0.84rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(5,150,105,0.2);">
              🎫 官方/線上特急車票 ➔
            </button>
            <button onclick="window.open(buildTripFlightUrl('${flightInfo.dest}'), '_blank')" style="flex:1; min-width:160px; background:#0284C7; color:#FFF; font-weight:900; border:none; padding:11px 16px; border-radius:10px; font-size:0.84rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(2,132,199,0.2);">
              ✈️ 查台北直飛${flightInfo.airport}特價機票 ➔
            </button>
            <button onclick="window.open(buildTripHotelUrl('${endStation}'), '_blank')" style="flex:1; min-width:160px; background:#FF5B00; color:#FFF; font-weight:900; border:none; padding:11px 16px; border-radius:10px; font-size:0.84rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(255,91,0,0.2);">
              🏨 ${endStation} 飯店 (Trip.com 5.5%回饋) ➔
            </button>
          </div>
        </div>

        <!-- 運行路線與主要停靠站 -->
        <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:16px; padding:20px; margin-bottom:20px;">
          <h4 style="font-size:1.05rem; font-weight:900; color:#1E293B; margin-bottom:12px;">🚏 運行路線與主要停靠站</h4>
          <div style="display:flex; flex-wrap:wrap; gap:8px; line-height:2;">
            ${stationsHtml}
          </div>
        </div>

        <!-- 車廂編組設施與大件行李配置 -->
        <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:16px; padding:20px; margin-bottom:20px;">
          <h4 style="font-size:1.05rem; font-weight:900; color:#1E293B; margin-bottom:8px;">🚃 車廂編組設施與大件行李配置</h4>
          <p style="font-size:0.86rem; color:#059669; font-weight:800; margin-bottom:12px; background:#ECFDF5; padding:8px 12px; border-radius:8px;">
            【${train.cars_count}】${train.car_layout}
          </p>
          <ul style="padding-left:18px; margin:0;">
            ${highlightsHtml}
          </ul>
        </div>

        <!-- 🪪 搭乘指南與上車準備 (極簡 ICON 資訊卡 ｜ 清爽整潔無壓迫) -->
        <div style="background:#FAF8F5; border:1.5px solid #EADBCE; border-radius:18px; padding:22px; margin-bottom:22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.4rem;">🪪</span>
              <h4 style="font-size:1.08rem; font-weight:900; color:#2D3748; margin:0;">日本鐵道上車指南 ＆ 行前必備</h4>
            </div>
            <span style="font-size:0.75rem; background:#FFF; border:1px solid #DDD8CE; color:#718096; padding:3px 10px; border-radius:20px; font-weight:700;">四大核心規範</span>
          </div>

          <!-- 4 塊極簡 ICON 亮點卡片 (大圖示、簡約標籤、零擁擠文字) -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(230px, 1fr)); gap:12px;">
            <!-- 1. 護照正本 -->
            <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:14px; padding:16px; display:flex; gap:14px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
              <div style="width:48px; height:48px; border-radius:12px; background:#FEF3C7; color:#B45309; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">🛂</div>
              <div>
                <div style="font-weight:900; font-size:0.92rem; color:#1E293B;">實體護照本</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:5px;">
                  <span style="font-size:0.7rem; font-weight:800; background:#FEF3C7; color:#92400E; padding:2px 7px; border-radius:4px;">查票必檢驗</span>
                  <span style="font-size:0.7rem; font-weight:700; background:#F1F5F9; color:#64748B; padding:2px 7px; border-radius:4px;">影本/拍照無效</span>
                </div>
              </div>
            </div>

            <!-- 2. 兒童票價 -->
            <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:14px; padding:16px; display:flex; gap:14px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
              <div style="width:48px; height:48px; border-radius:12px; background:#ECFDF5; color:#047857; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">👶</div>
              <div>
                <div style="font-weight:900; font-size:0.92rem; color:#1E293B;">兒童/幼兒票價</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:5px;">
                  <span style="font-size:0.7rem; font-weight:800; background:#ECFDF5; color:#065F46; padding:2px 7px; border-radius:4px;">未滿6歲 免票</span>
                  <span style="font-size:0.7rem; font-weight:700; background:#F1F5F9; color:#64748B; padding:2px 7px; border-radius:4px;">6-11歲 半價</span>
                </div>
              </div>
            </div>

            <!-- 3. 嬰兒推車 -->
            <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:14px; padding:16px; display:flex; gap:14px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
              <div style="width:48px; height:48px; border-radius:12px; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">🍼</div>
              <div>
                <div style="font-weight:900; font-size:0.92rem; color:#1E293B;">折疊嬰兒推車</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:5px;">
                  <span style="font-size:0.7rem; font-weight:800; background:#EFF6FF; color:#1E40AF; padding:2px 7px; border-radius:4px;">免費隨身攜帶</span>
                  <span style="font-size:0.7rem; font-weight:700; background:#F1F5F9; color:#64748B; padding:2px 7px; border-radius:4px;">放最後排/行李架</span>
                </div>
              </div>
            </div>

            <!-- 4. 特大行李席 -->
            <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:14px; padding:16px; display:flex; gap:14px; align-items:center; box-shadow:0 2px 6px rgba(0,0,0,0.02);">
              <div style="width:48px; height:48px; border-radius:12px; background:#FFF1F2; color:#BE123C; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">🧳</div>
              <div>
                <div style="font-weight:900; font-size:0.92rem; color:#1E293B;">特大行李預約席</div>
                <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:5px;">
                  <span style="font-size:0.7rem; font-weight:800; background:#FFF1F2; color:#9F1239; padding:2px 7px; border-radius:4px;">三邊合>160cm</span>
                  <span style="font-size:0.7rem; font-weight:700; background:#F1F5F9; color:#64748B; padding:2px 7px; border-radius:4px;">事先劃位免費</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 🗺️ 沿線推薦體驗景點 (移除時間軸，保留精選景點) -->
        <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:18px; padding:22px; margin-bottom:22px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
            <span style="font-size:1.3rem;">🗺️</span>
            <h4 style="font-size:1.08rem; font-weight:900; color:#1E293B; margin:0;">沿線推薦體驗景點</h4>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${itineraryHtml}
          </div>
        </div>

        <!-- 🗺️ 推薦周邊行程套票 (WITHOUT mentioning Klook, using tour_name) -->
        <div style="background:#F0FDF4; border:1.5px solid #BBF7D0; border-radius:16px; padding:20px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <div>
              <span style="font-size:0.75rem; font-weight:900; color:#15803D;">TOP RECOMMENDED TOUR</span>
              <h4 style="font-size:1.1rem; font-weight:900; color:#14532D; margin:2px 0 0;">🗺️ 沿線周邊推薦必去行程套票</h4>
            </div>
            <span style="font-size:0.75rem; background:#DCFCE7; color:#166534; font-weight:800; padding:4px 10px; border-radius:6px;">即買即用 ｜ 電子憑證</span>
          </div>
          <p style="font-size:0.84rem; color:#166534; line-height:1.6; margin-bottom:14px;">
            搭乘完觀光列車後，沿線最受旅人歡迎的必去景點！免排隊快速通關、專屬一日遊接駁與中文導覽。
          </p>
          <button onclick="window.open('${train.tour_url}', '_blank')" style="width:100%; background:#16A34A; color:#FFF; font-weight:900; border:none; padding:13px 20px; border-radius:12px; font-size:0.92rem; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 14px rgba(22,163,74,0.3); transition:all 0.2s;" onmouseover="this.style.background='#15803D'" onmouseout="this.style.background='#16A34A'">
            ${train.tour_name}
          </button>
        </div>

        <!-- 底部操作列 -->
        <div style="display:flex; gap:12px; flex-wrap:wrap; padding-top:16px; border-top:1px dashed #CBD5E1;">
          <button onclick="window.open('${train.ticket_url}', '_blank')" style="flex:1; background:#059669; color:#FFF; font-weight:900; border:none; padding:12px 24px; border-radius:12px; font-size:0.88rem; cursor:pointer;">
            🎫 官方 / 線上劃位特急車票 ➔
          </button>
          <button onclick="window.open('${train.hotel_url}', '_blank')" style="background:#FFF; color:#1E293B; font-weight:800; border:1px solid #CBD5E1; padding:12px 20px; border-radius:12px; font-size:0.88rem; cursor:pointer;">
            ${train.hotel_name}
          </button>
        </div>
      `;

      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function closeTrainDetail() {
      const modal = document.getElementById('trainDetailModal');
      if (modal) modal.classList.remove('show');
      document.body.style.overflow = '';
    }

    function scrollToSection(id) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function filterRailRoute(route, btn) {
      if (btn && btn.parentNode) {
        btn.parentNode.querySelectorAll('.rail-route-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      const cards = document.querySelectorAll('#train-cards-container .train-feature-card');
      cards.forEach(card => {
        const r = card.getAttribute('data-route') || '';
        if (route === 'all' || r === route) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function searchCampsites(query) {
      const q = query.trim().toLowerCase();
      const cards = document.querySelectorAll('.camp-item-card');
      cards.forEach(card => {
        const text = (card.getAttribute('data-name') || '').toLowerCase();
        if (!q || text.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }

    function filterCampRegion(region, btn) {
      if (btn && btn.parentNode) {
        btn.parentNode.querySelectorAll('.camp-pill-filter, .camp-region-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
      const cards = document.querySelectorAll('.camp-item-card');
      cards.forEach(card => {
        const r = card.getAttribute('data-region') || '';
        if (region === 'all' || r === region) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
      // smooth scroll to specific section if not all
      if (region === 'glamping') {
        const sec = document.getElementById('sec-glamping');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      } else if (region === 'rv') {
        const sec = document.getElementById('sec-rv');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      } else if (region === 'fuji') {
        const sec = document.getElementById('sec-fuji');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      } else if (region === 'hokkaido') {
        const sec = document.getElementById('sec-hokkaido');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      } else if (region === 'charter') {
        const sec = document.getElementById('sec-charter');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      } else if (region === 'drive-guide') {
        const sec = document.getElementById('sec-drive-guide');
        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // 🎪 動漫 Banner 輪播控制
    let currentAcgSlide = 0;
    function setAcgSlide(index) {
      currentAcgSlide = index;
      const slides = document.getElementById('acgCarouselSlides');
      const dots = document.querySelectorAll('.acg-dot');
      if (slides) {
        slides.style.transform = `translateX(-${index * 100}%)`;
      }
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === index);
      });
    }

    // 自動輪播
    setInterval(() => {
      const acgModal = document.getElementById('acgTopicModal');
      if (acgModal && acgModal.classList.contains('show')) {
        currentAcgSlide = (currentAcgSlide + 1) % 3;
        setAcgSlide(currentAcgSlide);
      }
    }, 4500);

    function selectRailRegion(region, btn) {
      btn.parentNode.querySelectorAll('.rail-region-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const card = document.getElementById('routePinSummary');
      if (region === 'kyushu') {
        card.innerHTML = `
          <span style="font-size:0.72rem; font-weight:800; background:#E6F4EA; color:#047857; padding:2px 8px; border-radius:6px;">九州人氣冠軍</span>
          <h3 style="font-size:1.15rem; font-weight:900; margin:8px 0 6px; color:#0F172A;">🌲 特急 由布院之森 (ゆふいんの森)</h3>
          <p style="font-size:0.82rem; color:#475569; line-height:1.6; margin-bottom:12px;">穿梭在杉木林海間的移動森林木屋。木質古典車廂、落地玻璃展望席與限定大豆冰淇淋。</p>
          <button onclick="scrollToArticle('train_yufuin')" style="background:#059669; color:#FFF; border:none; padding:8px 14px; border-radius:8px; font-size:0.76rem; font-weight:800; cursor:pointer;">📖 閱讀完整報導</button>
        `;
      } else if (region === 'tohoku') {
        card.innerHTML = `
          <span style="font-size:0.72rem; font-weight:800; background:#FEE2E2; color:#B91C1C; padding:2px 8px; border-radius:6px;">東北蒸機傳奇</span>
          <h3 style="font-size:1.15rem; font-weight:900; margin:8px 0 6px; color:#0F172A;">🚂 SL 磐越物語 (SLばんえつ物語)</h3>
          <p style="font-size:0.82rem; color:#475569; line-height:1.6; margin-bottom:12px;">經典C57貴婦人黑鐵蒸汽火車！4號車全景展望席直面阿賀野川水色峽谷。</p>
          <button onclick="scrollToArticle('train_sl_banetsu')" style="background:#DC2626; color:#FFF; border:none; padding:8px 14px; border-radius:8px; font-size:0.76rem; font-weight:800; cursor:pointer;">📖 閱讀完整報導</button>
        `;
      } else if (region === 'hokkaido') {
        card.innerHTML = `
          <span style="font-size:0.72rem; font-weight:800; background:#E0F2FE; color:#0369A1; padding:2px 8px; border-radius:6px;">冬季雪原限定</span>
          <h3 style="font-size:1.15rem; font-weight:900; margin:8px 0 6px; color:#0F172A;">❄️ SL 冬之濕原號 (釧路-標茶)</h3>
          <p style="font-size:0.82rem; color:#475569; line-height:1.6; margin-bottom:12px;">穿梭在釧路濕原銀白世界中，車廂內有炭火暖爐現烤魷魚，窗外偶遇野生丹頂鶴與蝦夷鹿！</p>
          <button onclick="alert('【SL 冬之濕原號】每年 1 月下旬至 3 月初行駛，全車指定席，推薦持 JR 北海道 Pass 提早 1 個月搶票！')" style="background:#0284C7; color:#FFF; border:none; padding:8px 14px; border-radius:8px; font-size:0.76rem; font-weight:800; cursor:pointer;">❄️ 查看冬季排程</button>
        `;
      } else if (region === 'kansai') {
        card.innerHTML = `
          <span style="font-size:0.72rem; font-weight:800; background:#FFEDD5; color:#C2410C; padding:2px 8px; border-radius:6px;">京都嵐山絕景</span>
          <h3 style="font-size:1.15rem; font-weight:900; margin:8px 0 6px; color:#0F172A;">🍁 嵯峨野觀光小火車 (Torokko)</h3>
          <p style="font-size:0.82rem; color:#475569; line-height:1.6; margin-bottom:12px;">穿梭在保津川峽谷懸崖邊，5號開放式「富貴號」無玻璃車廂能直接呼吸山林芬多精！</p>
          <button onclick="window.open('https://www.klook.com/zh-TW/search/result/?query=%E5%B5%AF%E5%B3%A8%E9%87%8E%20%E5%B0%8F%E7%81%AB%E8%BB%8A&aid=123436&utm_medium=affiliate-alwayson', '_blank')" style="background:#EA580C; color:#FFF; border:none; padding:8px 14px; border-radius:8px; font-size:0.76rem; font-weight:800; cursor:pointer;">🎟️ 預定嵐山小火車票</button>
        `;
      } else {
        card.innerHTML = `
          <span style="font-size:0.72rem; font-weight:800; background:#E6F4EA; color:#047857; padding:2px 8px; border-radius:6px;">站長推薦首選</span>
          <h3 style="font-size:1.15rem; font-weight:900; margin:8px 0 6px; color:#0F172A;">🌲 特急 由布院之森 (ゆふいんの森)</h3>
          <p style="font-size:0.82rem; color:#475569; line-height:1.6; margin-bottom:12px;">穿梭在杉木林海間的移動森林木屋。木質古典車廂、落地玻璃展望席與限定大豆冰淇淋。</p>
          <button onclick="scrollToArticle('train_yufuin')" style="background:#059669; color:#FFF; border:none; padding:8px 14px; border-radius:8px; font-size:0.76rem; font-weight:800; cursor:pointer;">📖 閱讀完整報導</button>
        `;
      }
    }

    function closeReadingSheet() {
      document.getElementById('readingSheet').classList.remove('show');
      document.getElementById('mainScrim').classList.remove('show');
    }
    function closeAllModals() {
      closeReadingSheet();
      closeUploadModal();
      closeGoogleNavModal();
    }
    // ===============================================================
    // 🧭 Google Maps 路線導航確認對話框邏輯
    // ===============================================================
    let pendingNavQuery = '';

    function openGoogleNavModal(destEncoded, spotTitleEncoded) {
      const destName = decodeURIComponent(destEncoded || '');
      const spotTitle = decodeURIComponent(spotTitleEncoded || '');
      pendingNavQuery = destName;

      const destEl = document.getElementById('navModalDestName');
      if (destEl) {
        destEl.innerHTML = `<span style="color:#E11D48; font-weight:900;">${destName}</span>${spotTitle ? `<div style="font-size:0.72rem; color:#64748B; margin-top:4px;">所屬名所景點：${spotTitle}</div>` : ''}`;
      }

      const scrim = document.getElementById('mainScrim');
      if (scrim) scrim.classList.add('show');

      const modal = document.getElementById('navConfirmModal');
      if (modal) modal.classList.add('show');
    }

    function closeGoogleNavModal() {
      const modal = document.getElementById('navConfirmModal');
      if (modal) modal.classList.remove('show');
      const scrim = document.getElementById('mainScrim');
      const uploadModal = document.getElementById('uploadModal');
      const readingSheet = document.getElementById('readingSheet');
      const isUploadOpen = uploadModal && uploadModal.classList.contains('show');
      const isSheetOpen = readingSheet && readingSheet.classList.contains('show');
      if (scrim && !isUploadOpen && !isSheetOpen) {
        scrim.classList.remove('show');
      }
    }

    function confirmGoogleNav() {
      if (pendingNavQuery) {
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pendingNavQuery)}`;
        window.open(mapUrl, '_blank', 'noopener,noreferrer');
      }
      closeGoogleNavModal();
    }


    // Klook ＆ Booking 分潤與優惠安全保護
    const KLOOK_AID = '123436';
    const KLOOK_AFFILIATE_PARAMS = 'aid=123436&utm_medium=affiliate-alwayson&utm_source=non-network&utm_campaign=123436';

    // ===============================================================
    // 🌐 全站多國語系聯盟分潤 URL 動態適配引擎 (Trip / Klook / Booking)
    // ===============================================================
    function getSpotCity(item) {
      if (!item) return '東京';
      if (item.hotel && item.hotel.city) return item.hotel.city;
      const tag = item.tag || '';
      if (tag.includes('東京')) return '東京';
      if (tag.includes('京都')) return '京都';
      if (tag.includes('大阪')) return '大阪';
      if (tag.includes('沖繩') || tag.includes('那霸')) return '那霸';
      if (tag.includes('北海道') || tag.includes('札幌')) return '札幌';
      if (tag.includes('弘前') || tag.includes('青森')) return '弘前';
      if (tag.includes('湯澤') || tag.includes('新潟')) return '湯澤';
      if (tag.includes('白馬') || tag.includes('長野')) return '白馬';
      if (tag.includes('二世谷') || tag.includes('新雪谷')) return '二世谷';
      if (tag.includes('河口湖') || tag.includes('富士')) return '富士河口湖';
      if (tag.includes('箱根')) return '箱根';
      if (tag.includes('日光')) return '日光';
      if (tag.includes('伊豆')) return '伊豆';
      if (tag.includes('福岡')) return '福岡';
      if (tag.includes('熊本')) return '熊本';
      if (tag.includes('奈良')) return '奈良';
      if (tag.includes('神戶') || tag.includes('兵庫')) return '神戶';
      if (tag.includes('廣島')) return '廣島';
      if (tag.includes('金澤')) return '金澤';
      if (tag.includes('名古屋') || tag.includes('愛知')) return '名古屋';
      if (tag.includes('富山')) return '富山';
      if (tag.includes('宮城') || tag.includes('仙台')) return '仙台';
      if (tag.includes('秋田')) return '秋田';
      if (tag.includes('岩手') || tag.includes('盛岡')) return '盛岡';
      if (tag.includes('山形')) return '山形';
      if (tag.includes('福島')) return '福島';
      if (tag.includes('鳥取')) return '鳥取';
      if (tag.includes('島根') || tag.includes('出雲')) return '出雲';
      if (tag.includes('香川') || tag.includes('高松')) return '高松';
      if (tag.includes('愛媛') || tag.includes('松山')) return '松山';
      if (tag.includes('高知')) return '高知';
      if (tag.includes('德島')) return '德島';
      if (tag.includes('大分') || tag.includes('由布')) return '由布院';
      if (tag.includes('鹿兒島') || tag.includes('指宿')) return '指宿';
      if (tag.includes('和歌山') || tag.includes('白濱') || tag.includes('熊野')) return '田邊';
      if (tag.includes('・')) {
        const parts = tag.split('・');
        return parts[parts.length - 1].replace(/[市區縣町]/g, '');
      }
      return tag || '日本';
    }

    function buildTripUrl(path) {
      if (!path) return TRIP_CONFIG.shortUrl;
      if (path.startsWith('https://www.trip.com/t/')) return path;
      const domMap = {
        'en': 'https://www.trip.com',
        'th': 'https://th.trip.com',
        'ja': 'https://jp.trip.com',
        'ko': 'https://kr.trip.com',
        'zh-CN': 'https://hk.trip.com',
        'zh-TW': 'https://tw.trip.com'
      };
      const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
      const base = domMap[l] || 'https://tw.trip.com';
      let baseUrl = path.startsWith('http') ? path : `${base}${path}`;
      baseUrl = baseUrl.replace(/https:\/\/(tw|jp|th|kr|hk|www)\.trip\.com/, base);
      const separator = baseUrl.includes('?') ? '&' : '?';
      if (!baseUrl.includes('Allianceid=')) {
        baseUrl += `${separator}${TRIP_AFFILIATE_QUERY}`;
      }
      return baseUrl;
    }

    function ensureKlookAffiliate(url, item) {
      const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
      const locMap = { 'en': 'en-US', 'th': 'th', 'ja': 'ja', 'ko': 'ko', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW' };
      const loc = locMap[l] || 'zh-TW';
      if (!url) {
        const q = item ? (item.title || item.tag || '日本') : '日本行程';
        return `https://www.klook.com/${loc}/search/result/?query=${encodeURIComponent(q)}&aid=123436&utm_medium=affiliate-alwayson`;
      }
      let target = url.replace(/klook\.com\/[a-zA-Z_\-]+(\/|$)/, `klook.com/${loc}/`);
      const sep = target.includes('?') ? '&' : '?';
      if (!target.includes('aid=')) {
        target += `${sep}aid=123436&utm_medium=affiliate-alwayson`;
      }
      return target;
    }

    function ensureBookingAffiliate(url, item) {
      const l = (typeof currentLang !== 'undefined') ? currentLang : 'zh-TW';
      const locMap = { 'en': 'en-gb', 'th': 'th', 'ja': 'ja', 'ko': 'ko', 'zh-CN': 'zh-cn', 'zh-TW': 'zh-tw' };
      const curMap = { 'en': 'USD', 'th': 'THB', 'ja': 'JPY', 'ko': 'KRW', 'zh-CN': 'CNY', 'zh-TW': 'TWD' };
      const loc = locMap[l] || 'zh-tw';
      const cur = curMap[l] || 'TWD';
      const city = getSpotCity(item);

      // 提取景點純淨名稱，組合成名所景點周邊 3~5km 精準搜尋（例如：舞鶴公園 福岡、千鳥之淵 東京）
      const cleanTitle = (item && item.title) ? item.title.replace(/（[^）]*）|\([^)]*\)/g, '').trim() : '';
      const spotSearch = cleanTitle ? `${cleanTitle} ${city}` : city;

      // 若原 URL 包含特定飯店頁面 (hotel/)，則保留該飯店獨立頁面並掛載 aid 與幣別
      if (url && url.includes('booking.com/hotel/')) {
        let target = url.replace(/booking\.com\/hotel\/[a-z\-]+\//, `booking.com/hotel/${loc}/`);
        const sep = target.includes('?') ? '&' : '?';
        if (!target.includes('aid=')) target += `${sep}aid=2422002`;
        if (!target.includes('selected_currency=')) target += `&selected_currency=${cur}`;
        return target;
      }

      // 其餘搜尋連結一律鎖定為該名所周邊住宿搜尋，帶入 aid=2422002 專屬分潤追蹤碼
      return `https://www.booking.com/searchresults.${loc}.html?ss=${encodeURIComponent(spotSearch)}&selected_currency=${cur}&aid=2422002`;
    }


    // 二級情境微篩選設定 (Contextual Filters)
    let SEASON_FILTERS_CONFIG = {};

    function renderDynamicFilter() {
      const config = SEASON_FILTERS_CONFIG[currentSeason] || SEASON_FILTERS_CONFIG['spots'];
      const regionLbl = document.getElementById('filterRegionLbl');
      const catLbl = document.getElementById('filterCatLbl');
      const regionContainer = document.getElementById('regionPillsContainer');
      const catContainer = document.getElementById('catPillsContainer');

      if (regionLbl) regionLbl.textContent = config.regionLbl;
      if (catLbl) catLbl.textContent = config.catLbl;

      if (regionContainer) {
        regionContainer.innerHTML = '';
        config.regions.forEach(r => {
          const btn = document.createElement('button');
          btn.className = `stamp-pill ${currentRegion === r.key ? 'active' : ''}`;
          btn.textContent = r.label;
          btn.onclick = () => filterRegion(r.key, btn);
          regionContainer.appendChild(btn);
        });
      }

      if (catContainer) {
        catContainer.innerHTML = '';
        config.categories.forEach(c => {
          const btn = document.createElement('button');
          const isReporter = c.key === 'report-only';
          btn.className = `stamp-pill ${isReporter ? 'stamp-pill-reporter' : ''} ${currentCategory === c.key ? 'active' : ''}`;
          btn.textContent = c.label;
          btn.onclick = () => filterCategory(c.key, btn);
          catContainer.appendChild(btn);
        });
      }
    }

    // 全寬頂部時令選單切換
    function switchSeason(season, el) {
      currentSeason = season;
      currentRegion = 'all';
      currentCategory = 'all';
      document.body.className = `mode-${season}`;

      document.querySelectorAll('.nav-strip-item').forEach(t => {
        t.className = t.className.replace(/active-[\w-]+/g, '').trim();
      });
      if (el) {
        const activeClass = season === 'sports' ? 'active-sports-theme' : `active-${season}`;
        el.classList.add(activeClass);
      } else {
        const found = document.querySelector(`.nav-strip-item.tab-${season}`);
        if (found) {
          const activeClass = season === 'sports' ? 'active-sports-theme' : `active-${season}`;
          found.classList.add(activeClass);
        }
      }

      renderSubContextPills(); renderDynamicFilter();
      renderCards();
      renderCommunityFeeds();
      initCanvasFX();
    }

    function filterRegion(reg, el) {
      currentRegion = reg;
      if (el && el.parentNode) {
        el.parentNode.querySelectorAll('.stamp-pill').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
      }
      renderCards();
    }

    function filterCategory(cat, el) {
      currentCategory = cat;
      if (el && el.parentNode) {
        el.parentNode.querySelectorAll('.stamp-pill').forEach(p => p.classList.remove('active'));
        el.classList.add('active');
      }
      renderCards();
    }

    // 旅人照片上傳 EXIF 解析 ＆ GPS 鄰近景點比對
    let currentUploadedFile = null;

    function handlePhotoDrop(e) {
      e.preventDefault();
      const dropzone = document.getElementById('uploadDropzone');
      if (dropzone) {
        dropzone.style.borderColor = '#CBD5E1';
        dropzone.style.background = '#F8FAFC';
      }
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        processPhotoFile(e.dataTransfer.files[0]);
      }
    }

    function handlePhotoSelect(input) {
      if (input.files && input.files[0]) {
        processPhotoFile(input.files[0]);
      }
    }

    function clearPhotoSelection(e) {
      if (e) e.stopPropagation();
      currentUploadedFile = null;
      const input = document.getElementById('photoFileInput');
      if (input) input.value = '';
      const prompt = document.getElementById('dropzonePrompt');
      const preview = document.getElementById('dropzonePreview');
      if (prompt) prompt.style.display = 'block';
      if (preview) preview.style.display = 'none';
      const img = document.getElementById('photoPreviewImg');
      if (img) img.src = '';
      const timeInput = document.getElementById('uploadShootTime');
      if (timeInput) timeInput.value = '';
    }

    function processPhotoFile(file) {
      if (!file) return;
      currentUploadedFile = file;
      const prompt = document.getElementById('dropzonePrompt');
      const preview = document.getElementById('dropzonePreview');
      const previewImg = document.getElementById('photoPreviewImg');
      const fileName = document.getElementById('photoFileName');
      const exifInfo = document.getElementById('photoExifInfo');

      if (fileName) fileName.textContent = file.name;
      if (previewImg) previewImg.src = URL.createObjectURL(file);
      if (prompt) prompt.style.display = 'none';
      if (preview) preview.style.display = 'flex';

      const reader = new FileReader();
      reader.onload = function (e) {
        const buffer = e.target.result;
        const exif = parseExifFromBuffer(buffer);
        let shootTimeStr = '';
        if (exif && exif.shootTime) {
          const parts = exif.shootTime.split(' ');
          if (parts.length >= 2) {
            const dateParts = parts[0].replace(/:/g, '/');
            const timeParts = parts[1].slice(0, 5);
            shootTimeStr = `${dateParts} ${timeParts} 現場實拍`;
          } else {
            shootTimeStr = `${exif.shootTime} 現場實拍`;
          }
        } else {
          const d = new Date(file.lastModified || Date.now());
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          shootTimeStr = `${d.getFullYear()}/${month}/${day} ${hours}:${mins} 現場實拍`;
        }

        const timeInput = document.getElementById('uploadShootTime');
        if (timeInput) timeInput.value = shootTimeStr;

        let matchedSpot = null;
        if (exif && exif.gps) {
          matchedSpot = findNearestSpot(exif.gps);
          if (matchedSpot) {
            const spotSelect = document.getElementById('uploadSpot');
            if (spotSelect) {
              let found = false;
              for (let opt of spotSelect.options) {
                if (opt.value === matchedSpot.title || opt.text.includes(matchedSpot.title)) {
                  spotSelect.value = opt.value;
                  found = true;
                  break;
                }
              }
              if (!found) {
                const opt = new Option(matchedSpot.title, matchedSpot.title, true, true);
                spotSelect.add(opt);
              }
            }
          }
        }

        if (exifInfo) {
          if (matchedSpot) {
            exifInfo.innerHTML = `✨ EXIF 自動解析：${shootTimeStr.split(' ')[0]} 拍攝 ｜ 比對最近景點【${matchedSpot.title}】`;
          } else {
            exifInfo.innerHTML = `✨ EXIF 自動解析拍攝時間：${shootTimeStr}`;
          }
        }
        showToast(`📸 已自動讀取相片 EXIF：${shootTimeStr}`, '✨');
      };
      reader.readAsArrayBuffer(file);
    }

    function parseExifFromBuffer(buffer) {
      try {
        const dataView = new DataView(buffer);
        if (dataView.getUint16(0) !== 0xFFD8) return null;
        let offset = 2;
        const length = buffer.byteLength;
        while (offset < length) {
          if (dataView.getUint8(offset) !== 0xFF) return null;
          const marker = dataView.getUint8(offset + 1);
          if (marker === 0xE1) {
            const exifHeader = String.fromCharCode(
              dataView.getUint8(offset + 4),
              dataView.getUint8(offset + 5),
              dataView.getUint8(offset + 6),
              dataView.getUint8(offset + 7)
            );
            if (exifHeader === 'Exif') {
              const tiffOffset = offset + 10;
              return parseTiffHeader(dataView, tiffOffset);
            }
          }
          offset += 2 + dataView.getUint16(offset + 2);
        }
      } catch (err) {
        console.warn('EXIF parse error:', err);
      }
      return null;
    }

    function parseTiffHeader(dataView, tiffOffset) {
      const byteOrder = dataView.getUint16(tiffOffset);
      const littleEndian = (byteOrder === 0x4949);
      const firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
      if (firstIFDOffset < 8) return null;

      const tags = parseIFD(dataView, tiffOffset, tiffOffset + firstIFDOffset, littleEndian);
      let shootTime = tags[0x0132];
      let exifSubIFDOffset = tags[0x8769];
      if (exifSubIFDOffset) {
        const subTags = parseIFD(dataView, tiffOffset, tiffOffset + exifSubIFDOffset, littleEndian);
        if (subTags[0x9003]) shootTime = subTags[0x9003];
      }
      let gps = null;
      let gpsIFDOffset = tags[0x8825];
      if (gpsIFDOffset) {
        const gpsTags = parseIFD(dataView, tiffOffset, tiffOffset + gpsIFDOffset, littleEndian);
        if (gpsTags[0x0002] && gpsTags[0x0004]) {
          const lat = convertDMSToDD(gpsTags[0x0002], gpsTags[0x0001]);
          const lng = convertDMSToDD(gpsTags[0x0004], gpsTags[0x0003]);
          gps = { lat, lng };
        }
      }
      return { shootTime, gps };
    }

    function parseIFD(dataView, tiffOffset, ifdOffset, littleEndian) {
      const tags = {};
      if (ifdOffset + 2 > dataView.byteLength) return tags;
      const numEntries = dataView.getUint16(ifdOffset, littleEndian);
      let offset = ifdOffset + 2;
      for (let i = 0; i < numEntries; i++) {
        if (offset + 12 > dataView.byteLength) break;
        const tag = dataView.getUint16(offset, littleEndian);
        const type = dataView.getUint16(offset + 2, littleEndian);
        const count = dataView.getUint32(offset + 4, littleEndian);
        if (type === 2) {
          const valueOffset = count > 4 ? tiffOffset + dataView.getUint32(offset + 8, littleEndian) : offset + 8;
          let str = '';
          for (let j = 0; j < count - 1; j++) {
            if (valueOffset + j >= dataView.byteLength) break;
            str += String.fromCharCode(dataView.getUint8(valueOffset + j));
          }
          tags[tag] = str.trim();
        } else if (type === 4) {
          tags[tag] = dataView.getUint32(offset + 8, littleEndian);
        } else if (type === 5) {
          const valOffset = tiffOffset + dataView.getUint32(offset + 8, littleEndian);
          const vals = [];
          for (let k = 0; k < count; k++) {
            if (valOffset + k * 8 + 8 > dataView.byteLength) break;
            const num = dataView.getUint32(valOffset + k * 8, littleEndian);
            const den = dataView.getUint32(valOffset + k * 8 + 4, littleEndian);
            vals.push(den ? (num / den) : 0);
          }
          tags[tag] = vals;
        }
        offset += 12;
      }
      return tags;
    }

    function convertDMSToDD(dms, ref) {
      if (!dms || dms.length < 3) return null;
      let dd = dms[0] + (dms[1] / 60) + (dms[2] / 3600);
      if (ref === 'S' || ref === 'W') dd = -dd;
      return dd;
    }

    let SPOT_GEO_COORDS = [];

    function findNearestSpot(gps) {
      if (!gps || !gps.lat || !gps.lng) return null;
      let nearest = null;
      let minD = Infinity;
      for (let s of SPOT_GEO_COORDS) {
        const d = Math.pow(gps.lat - s.lat, 2) + Math.pow(gps.lng - s.lng, 2);
        if (d < minD) {
          minD = d;
          nearest = s;
        }
      }
      return nearest;
    }

    let canvas, ctx, particles = [], fireworks = [];
    function initCanvasFX() {
      canvas = document.getElementById('fx-canvas');
      if (!canvas) return;
      ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      fireworks = [];

      let count = 22;
      if (currentSeason === 'sakura') count = 28; // 🌸 溫柔淡粉飄舞 (大幅減少避免疲勞)
      else if (currentSeason === 'wisteria') count = 24; // 💜 紫藤瀑布淡紫飄花 (減少密度)
      else if (currentSeason === 'nemophila') count = 24; // 💙 粉蝶花海粉藍花片
      else if (currentSeason === 'hydrangea') count = 22; // 🪻 繡球花紫藍花瓣
      else if (currentSeason === 'lavender') count = 22; // 🪻 薰衣草紫花
      else if (currentSeason === 'shibazakura') count = 22; // 🌸 芝櫻淡粉
      else if (currentSeason === 'snow') count = 45; // ❄️ 漫天晶瑩 JAPOW 輕盈粉雪
      else if (currentSeason === 'momiji') count = 20; // 🍁 丹楓落葉
      else if (currentSeason === 'ginkgo') count = 18; // 🍂 黃金銀杏
      else if (currentSeason === 'spots') count = 0;

      // 🌸 櫻花：粉粉淺淺淡雅粉彩
      const sakuraColors = ['#FFE4EB', '#FFD1DC', '#FFC1D0', '#FFB5C5', '#FFAEC0', '#FFF0F5'];
      // 💜 紫藤：優雅溫潤淡紫彩
      const wisteriaColors = ['#E9D5FF', '#D8B4FE', '#C084FC', '#F3E8FF', '#A855F7'];
      // 💙 粉蝶花：淺淺藍藍溫柔小花瓣
      const nemophilaColors = ['#E0F2FE', '#BAE6FD', '#7DD3FC', '#93C5FD', '#F0F9FF'];
      // 🪻 繡球花：淺淡青紫粉花瓣
      const hydrangeaColors = ['#C7D2FE', '#DDD6FE', '#BAE6FD', '#E0E7FF', '#93C5FD'];
      // 🪻 薰衣草：淡雅紫金
      const lavenderColors = ['#E9D5FF', '#D8B4FE', '#C084FC', '#F5EEFD'];
      // 🌸 芝櫻：柔嫩品粉
      const shibazakuraColors = ['#FCE7F3', '#FBCFE8', '#F472B6', '#FDA4AF'];
      // 🍁 丹楓：秋色落葉
      const momijiColors = ['#DC2626', '#EA580C', '#B91C1C', '#C2410C', '#991B1B', '#E11D48'];

      for (let i = 0; i < count; i++) {
        const isSakura = currentSeason === 'sakura';
        const isSnowFlurry = isSakura && (i % 3 === 0);
        const isMomiji = currentSeason === 'momiji';

        let particleColor = sakuraColors[i % sakuraColors.length];
        if (currentSeason === 'wisteria') {
          particleColor = wisteriaColors[i % wisteriaColors.length];
        } else if (currentSeason === 'nemophila') {
          particleColor = nemophilaColors[i % nemophilaColors.length];
        } else if (currentSeason === 'hydrangea') {
          particleColor = hydrangeaColors[i % hydrangeaColors.length];
        } else if (currentSeason === 'lavender') {
          particleColor = lavenderColors[i % lavenderColors.length];
        } else if (currentSeason === 'shibazakura') {
          particleColor = shibazakuraColors[i % shibazakuraColors.length];
        } else if (isMomiji) {
          particleColor = momijiColors[i % momijiColors.length];
        } else if (isSnowFlurry) {
          particleColor = 'rgba(255, 255, 255, 0.92)';
        }

        const isSnow = currentSeason === 'snow';
        let pSize;
        if (isSnow) {
          // ❄️ 0.8px ~ 2.1px 微小粉雪，絕不大顆笨重，兼顧空靈輕盈
          pSize = Math.random() * 1.3 + 0.8;
        } else if (isMomiji) {
          pSize = Math.random() * 6 + 9;
        } else if (currentSeason === 'wisteria') {
          pSize = Math.random() * 4 + 3.5;
        } else if (isSnowFlurry) {
          pSize = Math.random() * 1.4 + 0.8;
        } else {
          pSize = Math.random() * 5 + 3;
        }

        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          isSnowFlurry: isSnowFlurry,
          size: pSize,
          // ❄️ 緩慢微風飄落，夢幻柔和
          speedY: isSnow ? (Math.random() * 0.65 + 0.35) : (isMomiji ? (Math.random() * 0.9 + 0.55) : (currentSeason === 'wisteria' ? (Math.random() * 1.2 + 0.6) : (isSnowFlurry ? (Math.random() * 0.9 + 0.35) : (Math.random() * 1.1 + 0.45)))),
          speedX: isSnow ? (Math.random() * 0.4 - 0.2) : (isMomiji ? (Math.random() * 1.4 - 0.7) : (Math.random() * 0.8 - 0.4)),
          rot: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.03 - 0.015,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: isSnow ? (Math.random() * 0.02 + 0.01) : (Math.random() * 0.03 + 0.01),
          alpha: isSnow ? (Math.random() * 0.45 + 0.35) : (Math.random() * 0.35 + 0.65),
          color: particleColor,
          haloMultiplier: isSnow ? (Math.random() * 1.4 + 1.8) : 1
        });
      }
    }

    function createMorandiFirework() {
      const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
      const targetY = Math.random() * (canvas.height * 0.45) + canvas.height * 0.1;
      const colors = ['#C48B9F', '#6B8CA8', '#C9A24D', '#8E8299', '#A5B8AC', '#DE8A6D'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const particleCount = 38;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i;
        const speed = Math.random() * 2.8 + 1.2;
        fireworks.push({
          x: x, y: targetY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1, color: color,
          size: Math.random() * 2 + 1.2
        });
      }
    }

    let fireworkTimer = 0;

    function renderFX() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentSeason === 'hanabi') {
        fireworkTimer++;
        if (fireworkTimer % 40 === 0) createMorandiFirework();

        for (let i = fireworks.length - 1; i >= 0; i--) {
          const f = fireworks[i];
          ctx.save();
          ctx.globalAlpha = f.alpha;
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.035;
          f.alpha -= 0.016;

          if (f.alpha <= 0) fireworks.splice(i, 1);
        }
      } else if (currentSeason !== 'spots') {
        particles.forEach(p => {
          ctx.save();
          p.wobble += p.wobbleSpeed;
          const wobbleX = Math.sin(p.wobble) * 1.1;
          ctx.translate(p.x + wobbleX, p.y);
          ctx.rotate(p.rot);

          if (currentSeason === 'sakura') {
            // 🌸 逼真粉粉淺淺櫻花花瓣 (天然微凹心型弧度，飄逸飛舞)
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * 0.82;
            const s = p.size * 1.1;
            ctx.beginPath();
            ctx.moveTo(0, s * 1.15);
            ctx.bezierCurveTo(-s * 0.9, s * 0.45, -s * 0.95, -s * 0.6, -s * 0.35, -s);
            ctx.bezierCurveTo(-s * 0.15, -s * 0.65, s * 0.15, -s * 0.65, s * 0.35, -s);
            ctx.bezierCurveTo(s * 0.95, -s * 0.6, s * 0.9, s * 0.45, 0, s * 1.15);
            ctx.fill();
          } else if (currentSeason === 'wisteria') {
            // 💜 紫藤瀑布：水滴型優雅垂墜的紫色花瓣
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.moveTo(0, -p.size * 1.5);
            ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.5, p.size * 0.85, p.size * 0.8, 0, p.size * 1.2);
            ctx.bezierCurveTo(-p.size * 0.85, p.size * 0.8, -p.size * 0.85, -p.size * 0.5, 0, -p.size * 1.5);
            ctx.fill();
          } else if (currentSeason === 'nemophila') {
            // 💙 淺淺藍藍粉蝶花柔和圓潤小花瓣
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha * 0.8;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size * 0.9, p.size * 0.6, 0.25, 0, Math.PI * 2);
            ctx.fill();
          } else if (currentSeason === 'snow' || p.isSnowFlurry) {
            // ❄️ 唯美朦朧日系微細乾粉雪 (Soft Misty JAPOW Powder Snow)
            // 移除所有生硬十字與粗笨大顆粒，純淨徑向柔光漸層營造唯美散焦「朦朧感」
            const haloRadius = p.size * (p.haloMultiplier || 2.2);
            const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloRadius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.25)})`);
            grad.addColorStop(0.35, `rgba(240, 248, 255, ${p.alpha * 0.65})`);
            grad.addColorStop(0.7, `rgba(225, 240, 255, ${p.alpha * 0.2})`);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
            ctx.fill();
          } else if (currentSeason === 'momiji') {
            // 🍁 逼真五角日系丹楓紅葉 (Japanese Momiji 5-lobed Maple Leaf)
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            const s = p.size;

            // 隨風翻轉葉片 3D 透視感
            const flipY = Math.cos(p.wobble * 1.5);
            ctx.scale(1, flipY);

            ctx.beginPath();
            // 頂部主葉裂
            ctx.moveTo(0, -s);
            ctx.bezierCurveTo(s * 0.2, -s * 0.6, s * 0.35, -s * 0.3, 0, 0);
            ctx.bezierCurveTo(-s * 0.35, -s * 0.3, -s * 0.2, -s * 0.6, 0, -s);

            // 右側上方葉裂
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(s * 0.4, -s * 0.6, s * 0.85, -s * 0.4, s * 0.9, -s * 0.25);
            ctx.bezierCurveTo(s * 0.65, -s * 0.05, s * 0.3, -s * 0.05, 0, 0);

            // 左側上方葉裂
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-s * 0.4, -s * 0.6, -s * 0.85, -s * 0.4, -s * 0.9, -s * 0.25);
            ctx.bezierCurveTo(-s * 0.65, -s * 0.05, -s * 0.3, -s * 0.05, 0, 0);

            // 右側下方葉裂
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(s * 0.4, 0, s * 0.75, s * 0.2, s * 0.7, s * 0.45);
            ctx.bezierCurveTo(s * 0.4, s * 0.35, s * 0.2, s * 0.2, 0, 0);

            // 左側下方葉裂
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-s * 0.4, 0, -s * 0.75, s * 0.2, -s * 0.7, s * 0.45);
            ctx.bezierCurveTo(-s * 0.4, s * 0.35, -s * 0.2, s * 0.2, 0, 0);

            ctx.fill();

            // 葉柄葉脈細緻繪製
            ctx.strokeStyle = 'rgba(120, 20, 20, 0.6)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, s * 0.45); // 葉柄延伸
            ctx.stroke();

          } else if (currentSeason === 'ginkgo') {
            ctx.fillStyle = `rgba(201, 162, 77, ${p.alpha})`;
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 1.0, 0, Math.PI, true);
            ctx.lineTo(0, p.size * 0.3);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();

          p.y += p.speedY;
          p.x += p.speedX;
          p.rot += p.rotSpeed;
          if (p.y > canvas.height) p.y = -10;
          if (p.x > canvas.width) p.x = 0;
          if (p.x < 0) p.x = canvas.width;
        });
      }
      requestAnimationFrame(renderFX);
    }

    window.addEventListener('resize', () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    });

    // 🌐 所有內容資料改由外部 JSON 載入 (統一由 loadAllData 快取，避免重複請求)
    let _tabiDataPromise = null;
    function loadAllData() {
      if (!_tabiDataPromise) {
        _tabiDataPromise = Promise.all([
          fetch('data/spots.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/trains_database.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/community_feeds.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/hubs.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/season_upload_config.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/season_filters_config.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/spot_geo_coords.json', { cache: 'no-store' }).then(r => r.json()),
          fetch('data/i18n.json', { cache: 'no-store' }).then(r => r.json())
        ]).then(function (data) {
          SPOTS_DATABASE = data[0];
          TRAINS_DATABASE = data[1];
          COMMUNITY_FEEDS = data[2];
          MASTER_HUBS_CONFIG = data[3];
          SEASON_UPLOAD_CONFIG = data[4];
          SEASON_FILTERS_CONFIG = data[5];
          SPOT_GEO_COORDS = data[6];
          I18N = data[7];
        });
      }
      return _tabiDataPromise;
    }

    TabiLang.onChange(setLanguage);

    loadAllData().then(function () {
      renderDynamicRegionBar();
      setLanguage(currentLang);
      renderCards();
      renderCommunityFeeds();
      initCanvasFX();
      renderFX();
    }).catch(function (e) {
      console.error('首頁資料載入失敗:', e);
    });

    // ===============================================================
    // 🛡️ 防抄襲與防爬蟲安全防禦機制 (智慧財產權與原創文字保護)
    // ===============================================================
    function showToast(msg, icon = '🛡️') {
      const toast = document.getElementById('tabiToast');
      const msgEl = document.getElementById('toastMsg');
      const iconEl = document.getElementById('toastIcon');
      if (!toast) return;
      msgEl.textContent = msg;
      iconEl.textContent = icon;
      toast.classList.add('show');
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 3200);
    }

    // 封鎖右鍵選單
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showToast('《日旅報報》原創內容受著作權保護，未經書面授權禁止複製。', '🛡️');
    });

    // 封鎖 F12 與原始碼檢查快捷鍵
    document.addEventListener('keydown', function (e) {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
        (e.metaKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        showToast('檢視原始碼已停用。歡迎直接於《日旅報報》官網瀏覽！', '⛩️');
      }
    });

    // 文字複製自動掛載官方出處宣告
    /* copy listener removed */

    // 全站 Trip.com 深度追蹤封裝 (30天 Cookie 閉環)
    function goTripDeepLink(path, category) {
      const url = buildTripUrl(path || '/');
      window.open(url, '_blank');
    }

    // ===============================================================
    // ❤️ 我的日旅行程收藏本 (免登入、離線持久化保存 LocalStorage)
    // ===============================================================
    const TABI_FAVORITES_STORAGE_KEY = 'TABI_FAVORITES_V1';

    function getFavorites() {
      try {
        const raw = localStorage.getItem(TABI_FAVORITES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveFavorites(list) {
      try {
        localStorage.setItem(TABI_FAVORITES_STORAGE_KEY, JSON.stringify(list));
      } catch (e) { }
      updateFavoriteBadge();
    }

    function isFavorite(id) {
      try {
        const favs = JSON.parse(localStorage.getItem('TABI_FAVORITES_V1') || '[]');
        return favs.some(item => String(item.id) === String(id));
      } catch (e) { return false; }
    }

    function toggleFavorite(id, type, title, img, region, tag, extra) {
      if (!id) return;
      extra = extra || {};
      let favs = [];
      try { favs = JSON.parse(localStorage.getItem('TABI_FAVORITES_V1') || '[]'); } catch (e) { }
      const idx = favs.findIndex(item => String(item.id) === String(id));
      if (idx > -1) {
        favs.splice(idx, 1);
        if (typeof showToast === 'function') showToast('已從行程收藏本移除：' + title, '💔');
      } else {
        let spot = null;
        if (typeof SPOTS_DATABASE !== 'undefined') spot = SPOTS_DATABASE.find(s => String(s.id) === String(id));
        const desc = extra.desc || (spot ? (spot.desc || spot.subtitle || '') : '');
        const mapcode = extra.mapcode || (spot ? (spot.mapCode || spot.mapcode || '') : '');
        const location = extra.location || (spot ? spot.locationDetail : '');
        const tips = extra.tips || (spot ? (spot.bloomStatus || spot.snowStatus || '') : '');
        const link = extra.link || (spot ? (spot.klookUrl || spot.bookingUrl || '') : '');
        const navUrl = extra.navUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(title));

        favs.unshift({
          id: String(id),
          type: type || 'spot',
          title: title || (spot ? spot.title : ''),
          img: img || (spot ? spot.img : './images/japan_tabi_logo.png'),
          region: region || (spot ? spot.region : ''),
          tag: tag || (spot ? spot.tag : ''),
          desc: desc,
          mapcode: mapcode,
          location: location,
          tips: tips,
          link: link,
          navUrl: navUrl,
          addedAt: new Date().toISOString()
        });
        if (typeof showToast === 'function') showToast('已加入行程收藏本：' + title, '❤️');
      }
      try { localStorage.setItem('TABI_FAVORITES_V1', JSON.stringify(favs)); } catch (e) { }
      updateFavoriteBadge();
      if (typeof renderCards === 'function') renderCards();
      renderFavoritesList();
    }

    function toggleFavExpand(id) {
      const panel = document.getElementById('fav-detail-' + id);
      const btn = document.getElementById('fav-expand-btn-' + id);
      if (!panel) return;
      const isHidden = panel.style.display === 'none' || panel.style.display === '';
      if (isHidden) {
        panel.style.display = 'block';
        if (btn) btn.innerHTML = '收起 ▲';
      } else {
        panel.style.display = 'none';
        if (btn) btn.innerHTML = '展開 ▼';
      }
    }

    function renderFavoritesList() {
      const container = document.getElementById('favListContainer');
      if (!container) return;
      let favs = [];
      try { favs = JSON.parse(localStorage.getItem('TABI_FAVORITES_V1') || '[]'); } catch (e) { }

      if (favs.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#94A3B8;"><div style="font-size:36px; margin-bottom:12px;">🤍</div><div style="font-size:0.95rem; font-weight:800; color:#334155;">您的行程收藏匣是空的</div><div style="font-size:0.76rem; color:#94A3B8; margin-top:6px; line-height:1.65; max-width:280px; margin-left:auto; margin-right:auto;">瀏覽全站景點、沖繩自駕美食或特急列車時，點擊卡片右上角愛心即可隨時保存排程！</div></div>';
        return;
      }

      const AFF_HOTEL = 'https://tw.trip.com/?Allianceid=9507030&SID=325761227&trip_sub1=%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1_%E4%BD%8F%E5%AE%BF&trip_sub3=D20905663&redirect_url=https%3A%2F%2Ftw.trip.com%2Fhotels%2Ftokyo-hotels-list-294%2F';
      container.innerHTML = favs.map(item => {
        const safeTitle = (item.title || '').replace(/'/g, "\'");
        const hotelSearchUrl = (typeof buildTripHotelUrl === 'function') ? buildTripHotelUrl(item.region || item.title) : (AFF_HOTEL);
        const navUrl = item.navUrl || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(item.title));

        let detailHtml = '<div class="fav-detail-panel" id="fav-detail-' + item.id + '" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed #E2E8F0;">';
        if (item.desc) {
          detailHtml += '<div style="font-size:0.8rem; line-height:1.6; color:#334155; background:#F8FAFC; padding:8px 10px; border-radius:8px; margin-bottom:8px;"><strong style="color:#0F172A; display:block; margin-bottom:3px;">📝 名所特色簡介：</strong>' + item.desc + '</div>';
        }
        if (item.location || item.mapcode) {
          detailHtml += '<div style="font-size:0.76rem; display:flex; flex-direction:column; gap:4px; margin-bottom:8px; color:#475569;">';
          if (item.location) detailHtml += '<div>📍 <strong>交通指南：</strong>' + item.location + '</div>';
          if (item.mapcode) detailHtml += '<div>🚗 <strong>MapCode 導航：</strong><code style="background:#EEF2F6; padding:2px 6px; border-radius:4px; font-weight:800; color:#0F172A;">' + item.mapcode + '</code></div>';
          detailHtml += '</div>';
        }
        if (item.tips) {
          detailHtml += '<div style="font-size:0.76rem; color:#92400E; background:#FEF3C7; padding:6px 10px; border-radius:6px; font-weight:700; margin-bottom:10px;">💡 觀測秘笈：' + item.tips + '</div>';
        }
        detailHtml += '<div style="display:flex; gap:8px; flex-wrap:wrap;">';
        detailHtml += '<a href="' + navUrl + '" target="_blank" rel="noopener noreferrer" style="flex:1; min-width:100px; padding:7px 10px; border-radius:8px; font-size:0.76rem; font-weight:800; text-align:center; text-decoration:none; background:#0284C7; color:#FFFFFF;">🗺️ Google 導航 ↗</a>';
        detailHtml += '<a href="' + hotelSearchUrl + '" target="_blank" rel="noopener noreferrer" style="flex:1; min-width:100px; padding:7px 10px; border-radius:8px; font-size:0.76rem; font-weight:800; text-align:center; text-decoration:none; background:#059669; color:#FFFFFF;">🏨 周邊飯店比價 ↗</a>';
        if (item.link) {
          detailHtml += '<a href="' + item.link + '" target="_blank" rel="noopener noreferrer" style="flex:1; min-width:100px; padding:7px 10px; border-radius:8px; font-size:0.76rem; font-weight:800; text-align:center; text-decoration:none; background:#E11D48; color:#FFFFFF;">🎟️ 預約 / 票券 ↗</a>';
        }
        detailHtml += '</div></div>';

        return '<div class="fav-item-card" id="fav-card-' + item.id + '">' +
          '<div class="fav-item-main" onclick="toggleFavExpand(\'' + item.id + '\')" style="display:flex; gap:12px; align-items:center; cursor:pointer;">' +
          '<img src="' + item.img + '" alt="' + item.title + '" class="fav-thumb" onerror="this.src=\'./images/japan_tabi_logo.png\'" style="width:58px; height:58px; border-radius:10px; object-fit:cover; flex-shrink:0;">' +
          '<div class="fav-item-info" style="flex:1; min-width:0;">' +
          '<div class="fav-item-tag" style="font-size:0.68rem; color:#BE123C; font-weight:800; margin-bottom:2px;">' + (item.tag || '日旅情報') + '</div>' +
          '<div class="fav-item-title" title="' + item.title + '" style="font-size:0.88rem; font-weight:900; color:#1E293B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + item.title + '</div>' +
          '<div class="fav-item-region" style="font-size:0.72rem; color:#64748B; margin-top:3px;">' + (item.region ? '📍 ' + item.region : '🗾 日本精選') + '</div>' +
          '</div>' +
          '<div class="fav-item-actions" style="display:flex; align-items:center; gap:6px; flex-shrink:0;">' +
          '<button class="btn-fav-expand-toggle" id="fav-expand-btn-' + item.id + '" onclick="toggleFavExpand(\'' + item.id + '\'); event.stopPropagation();" title="點擊展開/收起詳細攻略" style="background:#F1F5F9; border:1px solid #E2E8F0; border-radius:6px; padding:4px 8px; font-size:0.72rem; font-weight:800; color:#475569; cursor:pointer;">展開 ▼</button>' +
          '<button class="btn-fav-remove" onclick="toggleFavorite(\'' + item.id + '\', \'' + item.type + '\', \'' + safeTitle + '\', \'' + item.img + '\'); event.stopPropagation();" title="從收藏匣移除" style="background:transparent; border:none; color:#94A3B8; font-size:15px; cursor:pointer; padding:4px 6px;">✕</button>' +
          '</div>' +
          '</div>' +
          detailHtml +
          '</div>';
      }).join('');
    }

    function clearAllFavorites() {
      if (confirm('確定要清空所有收藏的日本行程景點嗎？')) {
        saveFavorites([]);
        renderCards();
        renderFavoritesList();
        showToast('已清空所有行程收藏！', '🗑️');
      }
    }

    function copyMyFavoritesItinerary() {
      const favs = getFavorites();
      if (favs.length === 0) {
        showToast('目前尚無收藏項目可匯出！', '⚠️');
        return;
      }
      let text = "🎌【我的日本旅行排程清單 ｜ 日旅報報 收藏本】\n";
      text += "==================================\n";
      favs.forEach((item, i) => {
        text += `${i + 1}. [${item.tag || '景點'}] ${item.title} (${item.region || '日本'})\n`;
      });
      text += "==================================\n";
      text += "行程規劃來源：《日旅報報 JAPAN TABI》\n" + window.location.href;

      navigator.clipboard.writeText(text).then(() => {
        showToast('已複製行程文字清單至剪貼簿！可直接貼至記事本。', '📋');
      }).catch(() => {
        showToast('複製失敗，請手動複製！', '⚠️');
      });
    }

    // ===============================================================
    // 💴 即時日幣匯率 ＆ 10%免稅試算小工具邏輯
    // ===============================================================
    function openFxCalculator() {
      const modal = document.getElementById('fxCalculatorModal');
      const backdrop = document.getElementById('fxBackdrop');
      if (modal) modal.classList.add('show');
      if (backdrop) backdrop.classList.add('show');
      document.body.style.overflow = 'hidden';
      if (typeof calculateFx === 'function') calculateFx();
      else if (typeof window.calculateFx === 'function') window.calculateFx();
    }

    function closeFxCalculator() {
      const modal = document.getElementById('fxCalculatorModal');
      const backdrop = document.getElementById('fxBackdrop');
      if (modal) modal.classList.remove('show');
      if (backdrop) backdrop.classList.remove('show');
      document.body.style.overflow = '';
    }

    function setQuickJpy(val) {
      document.getElementById('fxJpyInput').value = val;
      calculateFx();
    }

    function calculateFx() {
      const rateInput = document.getElementById('fxRateInput');
      const jpyInput = document.getElementById('fxJpyInput');
      if (!rateInput || !jpyInput) return;

      const rate = parseFloat(rateInput.value) || 0.215;
      const jpy = parseFloat(jpyInput.value) || 0;

      // 1. 一般含稅價
      const normTwd = Math.round(jpy * rate);
      document.getElementById('fxNormTwd').textContent = `NT$ ${normTwd.toLocaleString()}`;
      document.getElementById('fxNormJpy').textContent = `含稅 ¥${Math.round(jpy).toLocaleString()}`;

      // 2. 10% 退稅價 (未稅金額 = 含稅 / 1.1)
      const taxFreeJpy = Math.round(jpy / 1.1);
      const taxFreeTwd = Math.round(taxFreeJpy * rate);
      const savedTwd = normTwd - taxFreeTwd;
      document.getElementById('fxTaxFreeTwd').textContent = `NT$ ${taxFreeTwd.toLocaleString()}`;
      document.getElementById('fxTaxFreeJpy').textContent = `未稅 ¥${taxFreeJpy.toLocaleString()} (現省 NT$ ${savedTwd.toLocaleString()})`;

      // 3. 免稅 + 百貨/唐吉 5% 優惠券折抵 (未稅 * 0.95)
      const couponJpy = Math.round(taxFreeJpy * 0.95);
      const couponTwd = Math.round(couponJpy * rate);
      document.getElementById('fxCouponTwd').textContent = `NT$ ${couponTwd.toLocaleString()}`;
      document.getElementById('fxCouponJpy').textContent = `實付 ¥${couponJpy.toLocaleString()} (現省 NT$ ${(normTwd - couponTwd).toLocaleString()})`;
    }

    // 初始化收藏本計數與動態情境篩選
    document.addEventListener('DOMContentLoaded', function () {
      updateFavoriteBadge();
      // 🌸 首頁預設認定顯示「賞花前線」，自動展開所有花種選項 (櫻花、紫藤花、粉蝶花、繡球花、秋楓、銀杏)
      currentMasterHub = 'flower';
      currentSeason = 'sakura';
      currentSubItemId = 'sakura_bloom';
      document.body.className = 'mode-sakura';
      loadAllData().then(function () {
        renderSubContextPills();
        renderFeatureFilterBar();
        renderDynamicRegionBar();
        renderDynamicFilter();
        renderCards();
        initCanvasFX();
      }).catch(function (e) {
        console.error('首頁資料載入失敗:', e);
      });
    });


    function updateTrainDetailFavBtn(trainId) {
      const btn = document.getElementById(`trainFavBtn_${trainId}`);
      if (!btn) return;
      const isFav = isFavorite(trainId);
      btn.style.background = isFav ? '#FFF1F2' : '#FFF';
      btn.style.borderColor = isFav ? '#FDA4AF' : '#E2E8F0';
      btn.style.color = isFav ? '#BE123C' : '#475569';
      btn.innerHTML = `<span>${isFav ? '❤️ 已在我的收藏本' : '🤍 收藏此觀光列車'}</span>`;
    }


    // ⚡ 寶可夢橫向滾動容器控制
    function scrollPokemonContainer(distance) {
      const container = document.getElementById('pokemonScrollTrack');
      if (container) {
        container.scrollBy({ left: distance, behavior: 'smooth' });
      }
    }

    // 🎮 ACG 專區雙維度篩選狀態 (地區 ＋ 主題)
    let currentAcgRegion = 'all';
    let currentAcgCategory = 'all';

    function setAcgRegionFilter(region, btn) {
      currentAcgRegion = region;
      document.querySelectorAll('.acg-filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyAcgFilters();
    }

    function setAcgCategoryFilter(category, btn) {
      currentAcgCategory = category;
      document.querySelectorAll('.acg-cat-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyAcgFilters();
    }

    function applyAcgFilters() {
      const cards = document.querySelectorAll('.acg-shop-card');
      let visibleCount = 0;
      cards.forEach(card => {
        const r = card.getAttribute('data-region') || '';
        const c = card.getAttribute('data-category') || '';
        const matchRegion = (currentAcgRegion === 'all' || r === currentAcgRegion);
        const matchCategory = (currentAcgCategory === 'all' || c === currentAcgCategory);
        if (matchRegion && matchCategory) {
          card.style.display = 'flex';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
    }


    // 🚗 日本租車＆包車專題 Modal 開關控制
    function openCarPortal() {
      document.getElementById('carRentalTopicModal').classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function closeCarPortal() {
      document.getElementById('carRentalTopicModal').classList.remove('show');
      document.body.style.overflow = '';
    }

    function executeCarTripSearch() {
      const from = document.getElementById('tripSearchFromCar') ? document.getElementById('tripSearchFromCar').value : 'taipei';
      const dest = document.getElementById('tripSearchDestCar') ? document.getElementById('tripSearchDestCar').value : 'tokyo';
      const url = buildTripFlightUrl(dest, from);
      window.open(url, '_blank');
    }

    function copyDrivingChecklist() {
      const text = `🎌【日本自駕出發前必備備忘錄 ｜ 日旅報報 官方認證】
=========================================
1. 🪪 證件清單：
   - 台灣旅客：台灣駕照實體正本 ＋ 監理站日文譯本正本 ＋ 護照正本 (國際駕照在日無效！)
   - 港澳旅客：國際駕照 (IDP 1949公約) ＋ 本地駕照正本 ＋ 護照正本
2. 💳 ETC 與過路費：
   - 取車時加租 ETC 卡片 (閘道減速至 20km/h 通過)
3. ⛽ 加油要點：
   - 汽油車加「Regular (レギュラー，紅色油槍)」，切勿加錯柴油軽油！
4. 🛑 重要交規：
   - 鐵路平交道前方必須「一時停止」完全煞停 3 秒確認無車
   - 右轉車必須絕對禮讓對向直行車與左轉車先行
   - 嚴禁路邊違規停車，違者重罰 15,000~25,000 日圓
5. 🆘 緊急求助 SOP：
   - 報警：110 ｜ 救護：119 ｜ 道路救援：#8139
   - 即使輕微擦撞也必須報警開立「事故證明書」，保險方可理賠！
=========================================
來源：《日旅報報 JAPAN TABI》日本自駕指南
${window.location.href}`;

      navigator.clipboard.writeText(text).then(() => {
        showToast('已複製自駕備忘錄清單至剪貼簿！可貼至手機備忘錄。', '📋');
      }).catch(() => {
        showToast('複製成功！', '📋');
      });
    }


    // 🚪 關閉所有專題彈窗並順暢平滑回到首頁頂部
    function closeAllTopicPortals() {
      document.querySelectorAll('.special-topic-modal').forEach(m => m.classList.remove('show'));
      document.body.style.overflow = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 📋 複製優惠碼並立即跳轉 Trip.com (確保 30 天 Cookie 分潤鎖定)
    function copyAndGoTrip(code, path) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          showToast(`已複製優惠碼 ${code}！正在前往 Trip.com 啟用 30 天優惠...`, '🎁');
        }).catch(() => { });
      }
      setTimeout(() => {
        goTripDeepLink(path || TRIP_CONFIG.shortUrl);
      }, 350);
    }


    // 📸 全日本花況現場即時情報局 Modal 交互
    function openLiveReportModal(initialTab) {
      const modal = document.getElementById('liveReportModal');
      const scrim = document.getElementById('mainScrim');
      if (modal) modal.classList.add('show');
      if (scrim) scrim.classList.add('active');
      if (initialTab) switchLiveModalTab(initialTab);
    }

    function closeLiveReportModal() {
      const modal = document.getElementById('liveReportModal');
      const scrim = document.getElementById('mainScrim');
      if (modal) modal.classList.remove('show');
      if (scrim) scrim.classList.remove('active');
    }

    function switchLiveModalTab(tabKey) {
      const pTab = document.getElementById('tabLivePhotos');
      const uTab = document.getElementById('tabLiveUpload');
      const pView = document.getElementById('liveViewPhotos');
      const uView = document.getElementById('liveViewUpload');
      if (tabKey === 'photos') {
        if (pTab) pTab.classList.add('active');
        if (uTab) uTab.classList.remove('active');
        if (pView) pView.style.display = 'block';
        if (uView) uView.style.display = 'none';
      } else {
        if (pTab) pTab.classList.remove('active');
        if (uTab) uTab.classList.add('active');
        if (pView) pView.style.display = 'none';
        if (uView) uView.style.display = 'block';
      }
    }

    function likeLivePost(btn, baseCount) {
      const countEl = btn.querySelector('.like-count');
      if (!countEl) return;
      let curr = parseInt(countEl.innerText) || baseCount;
      if (!btn.classList.contains('liked')) {
        btn.classList.add('liked');
        countEl.innerText = curr + 1;
        btn.style.background = '#FDA4AF';
        btn.style.color = '#881337';
      }
    }

    function jumpToSpotCard(spotId) {
      closeLiveReportModal();
      const el = document.getElementById(`spot-${spotId}`) || document.querySelector(`[data-spot-id="${spotId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.outline = '3px solid #C53D43';
        setTimeout(() => { el.style.outline = 'none'; }, 2500);
      }
    }

    function handleModalPhotoPreview(input) {
      if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const wrap = document.getElementById('modalPhotoPreviewWrap');
          const img = document.getElementById('modalPhotoPreviewImg');
          if (wrap && img) {
            img.src = e.target.result;
            wrap.style.display = 'block';
          }
        };
        reader.readAsDataURL(input.files[0]);
      }
    }

    function submitLiveReport() {
      alert('🎉 感謝您的現地取材回報！您的即時花況已發布至相簿，協助正在規劃的旅人！');
      switchLiveModalTab('photos');
    }

  