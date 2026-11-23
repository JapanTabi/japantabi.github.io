/**
 * 日旅報報 JAPAN TABI - 核心腳本庫 (Tabi Core JS)
 * 功能包含：
 * 1. 行程收藏本 (Favorites Drawer) 離線資料庫管理 (TABI_FAVORITES_V1)
 * 2. 景點卡片詳細情報折疊手風琴 (Accordion Expansion)
 * 3. 精緻小巧愛心按鈕 (Subtle 12px Retina Heart Icon)
 * 4. 全站統一步調浮動工具箱 (Floating Square Hub)
 * 5. 官方防盜版、著作權防護與轉載追蹤宣告
 */

(function () {
  'use strict';

  function coreText(key, source, params) {
    const text = TabiLang.t(key, params);
    return text === key ? source : text;
  }

  const STORAGE_KEY = 'TABI_FAVORITES_V1';
  const TRIP_SHORT_URL = 'https://www.trip.com/t/fgyJcXow1X2';
  const TRIP_AFFILIATE_QUERY = 'Allianceid=9507030&SID=325761227&trip_sub1=%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1&trip_sub3=D20905663&linkhub_token=sl_fgyJcXow1X2';
  const AFFILIATE_FLIGHT_HOTEL = `https://tw.trip.com/?Allianceid=9507030&SID=325761227&trip_sub1=%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1_%E4%BD%8F%E5%AE%BF&trip_sub3=D20905663&redirect_url=https%3A%2F%2Ftw.trip.com%2Fhotels%2Ftokyo-hotels-list-294%2F`;

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

  function getTripHotelUrl(cityName) {
    const l = TabiLang.get();
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

  // 1. 小巧精緻 SVG 愛心圖示產生器 (12px / 14px)
  function getHeartSvg(isActive, size = 12) {
    if (isActive) {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
    }
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
  }

  // 2. 本地儲存庫存取
  function getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[TABI] Failed to read localStorage', e);
      return [];
    }
  }

  function saveFavorites(favs) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
    } catch (e) {
      console.warn('[TABI] Failed to save localStorage', e);
    }
    updateFavoriteBadge();
    updateAllHeartButtons();
    window.dispatchEvent(new CustomEvent('tabi:favorites-updated', { detail: favs }));
  }

  function sameFavorite(item, id, title, region) {
    const left = window.TabiSpotIdentity ? TabiSpotIdentity.resolve(item) : item;
    const right = window.TabiSpotIdentity ? TabiSpotIdentity.resolve({id, title, region}) : {id, title, region};
    if (String(left.id) !== String(right.id)) return false;
    if (title === undefined) return true;
    return left.title === right.title && (!right.region || !left.region || left.region === right.region);
  }
  function isFavorite(id, title, region) {
    if (!id) return false;
    return getFavorites().some(item => sameFavorite(item, id, title, region));
  }

  // 3. 加入 / 移除收藏核心方法
  window.toggleFavorite = function (id, type, title, img, region, tag, extra = {}) {
    if (!id || !title) return;
    if (window.TabiSpotIdentity) { const resolved = TabiSpotIdentity.resolve({id, title, region}); id = resolved.id; title = resolved.title; region = resolved.region; }
    id = String(id);
    let favs = getFavorites();
    const idx = extra.savedSnapshot ? favs.findIndex(item => String(item.id) === String(extra.savedSnapshot.id) && item.title === extra.savedSnapshot.title && item.region === extra.savedSnapshot.region) : favs.findIndex(item => sameFavorite(item, id, title, region));
    const displayTitle = TabiSpotI18n.favorite({ id, title, region }).title;

    if (idx > -1) {
      favs.splice(idx, 1);
      showTabiToast(coreText('home.favoriteRemoved', `已從行程收藏本移除：${displayTitle}`, { title: displayTitle }), '💔');
    } else {
      // 嘗試從全域資料庫比對補全情報
      let spot = TabiSpotI18n.findSource(id, title, region);
      if (!spot && typeof window.SPOTS_DATABASE !== 'undefined' && Array.isArray(window.SPOTS_DATABASE)) {
        spot = window.SPOTS_DATABASE.find(s => String(s.id) === id);
      }
      const allTrains = typeof window.TRAINS_DATA !== 'undefined' ? window.TRAINS_DATA : (typeof window.TRAINS_DATABASE !== 'undefined' ? window.TRAINS_DATABASE : null);
      if (!spot && allTrains && Array.isArray(allTrains)) {
        spot = allTrains.find(t => String(t.id) === id);
      }

      const desc = extra.desc || (spot ? (spot.desc || spot.subtitle || '') : '');
      const mapcode = extra.mapcode || (spot ? (spot.mapCode || spot.mapcode || '') : '');
      const location = extra.location || (spot ? (spot.locationDetail || spot.section || '') : '');
      const tips = extra.tips || (spot ? (spot.bloomStatus || spot.snowStatus || spot.badge || (spot.highlights ? spot.highlights.join('、') : '')) : '');
      const link = extra.link || (spot ? (spot.klookUrl || spot.ticket_url || spot.bookingUrl || '') : '');
      const navUrl = extra.navUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`;

      favs.unshift({
        id,
        type: type || 'spot',
        sourceKey: TabiSpotI18n.key({ id, title, region }),
        title,
        img: img || './images/japan_tabi_logo.png',
        region: region || (spot ? (spot.region || spot.route_category || '') : ''),
        tag: tag || (spot ? (spot.tag || spot.badge || '日本名所') : '日本名所'),
        desc,
        mapcode,
        location,
        tips,
        link,
        navUrl,
        addedAt: new Date().toISOString()
      });
      showTabiToast(coreText('home.favoriteAdded', `已加入行程收藏本：${displayTitle}`, { title: displayTitle }), '❤️');
    }

    saveFavorites(favs);
    if (typeof window.renderCards === 'function') {
      try { window.renderCards(); } catch (e) {}
    }
    renderFavoritesList();
  };

  // 3b. 由卡片 data-* 屬性讀取資料的安全收藏入口 (避免 inline 字串跳脫錯誤)
  window.tabiFavFromBtn = function (btn, ev) {
    if (ev) ev.stopPropagation();
    const d = (k) => { try { return decodeURIComponent(btn.getAttribute('data-' + k) || ''); } catch (e) { return ''; } };
    window.toggleFavorite(d('id'), btn.getAttribute('data-type'), d('title'), d('img'), d('region'), d('tag'), {
      desc: d('desc'), location: d('loc'), tips: d('tips'), link: d('link'), navUrl: d('nav') || undefined
    });
  };

  // 4. 更新收藏徽章計數
  window.updateFavoriteBadge = function () {
    const favs = getFavorites();
    const count = favs.length;
    document.querySelectorAll('.square-hub-badge, #favCountBadge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  };

  // 5. 更新所有畫面中的卡片愛心圖示狀態
  window.updateAllHeartButtons = function () {
    const favs = getFavorites();


    // 支援通用屬性 data-fav-id
    document.querySelectorAll('.btn-card-fav[data-fav-id]').forEach(btn => {
      const id = btn.getAttribute('data-fav-id');
      const card = btn.closest('[data-spot-id]');
      const active = card ? isFavorite(id, card.dataset.sourceTitle, card.dataset.sourceRegion) : isFavorite(id);
      if (active) {
        btn.classList.add('active');
        btn.innerHTML = getHeartSvg(true, 12);
        btn.setAttribute('title', coreText('favorites.saved', '已在行程收藏本'));
      } else {
        btn.classList.remove('active');
        btn.innerHTML = getHeartSvg(false, 12);
        btn.setAttribute('title', coreText('favorites.add', '加入我的行程收藏'));
      }
    });

    // 針對非 data-fav-id 的靜態按鈕
    document.querySelectorAll('[id^="trainFavBtn_"]').forEach(btn => {
      const id = btn.id.replace('trainFavBtn_', '');
      const active = isFavorite(id);
      if (active) {
        btn.classList.add('active');
        btn.innerHTML = getHeartSvg(true, 12) + ' ' + coreText('favorites.saved', '已在收藏本');
      } else {
        btn.classList.remove('active');
        btn.innerHTML = getHeartSvg(false, 12) + ' ' + coreText('favorites.add', '加入行程收藏');
      }
    });
  };

  function regionLabel(region) {
    if (!region) return coreText('favorites.japan', '日本');
    const key = 'home.region.' + region;
    const label = TabiLang.t(key);
    return label === key ? region : label;
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function externalLink(url, label, className) {
    try {
      const parsed = new URL(url, location.href);
      if (!['https:', 'http:'].includes(parsed.protocol)) return null;
      const link = node('a', 'fav-detail-btn ' + className, label);
      link.href = parsed.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    } catch { return null; }
  }
  // Drawer details use an identity key, so two different places sharing an old ID stay separate.
  window.toggleFavExpand = function (identity) {
    let panel = document.getElementById('fav-detail-' + identity);
    if (!panel) panel = Array.from(document.querySelectorAll('.fav-item-card')).find(card => card.dataset.sourceId === String(identity))?.querySelector('.fav-detail-panel');
    if (!panel) return;
    const card = panel.closest('.fav-item-card');
    panel.hidden = !panel.hidden;
    const expanded = !panel.hidden;
    card.querySelector('.btn-fav-expand-toggle').textContent = coreText(expanded ? 'favorites.collapse' : 'favorites.expand', expanded ? '收起 ▲' : '展開 ▼');
    card.querySelector('.fav-item-main').setAttribute('aria-expanded', String(expanded));
  };
  window.renderFavoritesList = function () {
    const container = document.getElementById('favListContainer');
    if (!container) return;
    const expanded = new Set(Array.from(container.querySelectorAll('.fav-detail-panel:not([hidden])')).map(panel => panel.closest('.fav-item-card').dataset.favoriteKey));
    const scroll = container.scrollTop;
    const favs = getFavorites();
    const fragment = document.createDocumentFragment();
    if (!favs.length) {
      const empty = node('div', 'favorites-empty-state');
      empty.append(node('div', '', '🤍'), node('h4', '', coreText('favorites.empty', '您的行程收藏匣是空的')), node('p', '', coreText('favorites.emptyHint', '點擊景點卡片的愛心即可收藏。')));
      fragment.append(empty);
    }
    let sourceNotice = false;
    favs.forEach(source => {
      const item = TabiSpotI18n.favorite(source);
      if (!item.copyTranslated) sourceNotice = true;
      const identity = encodeURIComponent(TabiSpotI18n.key(source));
      const card = node('div', 'fav-item-card');
      card.dataset.favoriteKey = identity;
      card.dataset.sourceId = source.id;
      card.dataset.copyLanguage = item.copyLanguage;
      const main = node('div', 'fav-item-main');
      main.tabIndex = 0;
      main.setAttribute('role', 'button');
      main.setAttribute('aria-expanded', String(expanded.has(identity)));
      const toggle = () => window.toggleFavExpand(identity);
      main.onclick = event => { if (!event.target.closest('button,a')) toggle(); };
      main.onkeydown = event => { if (event.target === main && ['Enter', ' '].includes(event.key)) { event.preventDefault(); toggle(); } };
      const image = node('img', 'fav-thumb');
      image.src = source.img || './images/japan_tabi_logo.png';
      image.alt = item.title || '';
      image.onerror = function () { this.onerror = null; this.src = './images/japan_tabi_logo.png'; };
      const info = node('div', 'fav-item-info');
      info.append(node('div', 'fav-item-tag', item.tag || coreText('favorites.defaultTag', '日本名所')), node('div', 'fav-item-title', item.title), node('div', 'fav-item-region', '📍 ' + regionLabel(source.region)));
      info.querySelector('.fav-item-title').title = item.title || '';
      const actions = node('div', 'fav-item-actions');
      const expand = node('button', 'btn-fav-expand-toggle', coreText(expanded.has(identity) ? 'favorites.collapse' : 'favorites.expand', expanded.has(identity) ? '收起 ▲' : '展開 ▼'));
      expand.type = 'button';
      expand.title = coreText('favorites.toggle', '展開或收起景點詳情');
      expand.onclick = event => { event.stopPropagation(); toggle(); };
      const remove = node('button', 'btn-fav-remove', '✕');
      remove.type = 'button';
      remove.title = coreText('favorites.remove', '從收藏匣移除');
      remove.setAttribute('aria-label', remove.title);
      remove.onclick = event => { event.stopPropagation(); window.toggleFavorite(source.id, source.type, source.title, source.img, source.region, source.tag, {savedSnapshot: source}); };
      actions.append(expand, remove);
      main.append(image, info, actions);
      const panel = node('div', 'fav-detail-panel');
      panel.id = 'fav-detail-' + identity;
      panel.hidden = !expanded.has(identity);
      main.setAttribute('aria-controls', panel.id);
      function detail(value, key, className) {
        if (!value) return;
        const block = node('div', className);
        block.append(node('strong', '', coreText('favorites.' + key, key) + ': '), node('span', '', value));
        panel.append(block);
      }
      detail(item.desc, 'description', 'fav-detail-desc');
      detail(item.location, 'transit', 'fav-detail-meta');
      detail(source.mapcode, 'mapcode', 'fav-detail-meta');
      detail(item.tips, 'tips', 'fav-detail-tip');
      const links = node('div', 'fav-detail-links');
      const nav = externalLink(source.navUrl || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(source.title), coreText('favorites.navigate', '🗺️ Google 導航 ↗'), 'fav-btn-nav');
      const hotels = externalLink(getTripHotelUrl(source.region || source.title), coreText('favorites.hotels', '🏨 周邊飯店比價 ↗'), 'fav-btn-hotel');
      const ticket = source.link && externalLink(source.link, coreText('favorites.tickets', '🎟️ 預約／票券 ↗'), 'fav-btn-booking');
      [nav, hotels, ticket].filter(Boolean).forEach(link => links.append(link));
      panel.append(links);
      card.append(main, panel);
      fragment.append(card);
    });
    if (sourceNotice && TabiLang.get() !== 'zh-TW') {
      const notice = node('p', 'favorites-source-notice', coreText('spots.sourceNotice', '部分景點內容以原文顯示。'));
      fragment.prepend(notice);
    }
    container.replaceChildren(fragment);
    container.scrollTop = scroll;
  };

  // 8. 抽屜開關
  window.openFavoritesDrawer = function () {
    renderFavoritesList();
    const drawer = document.getElementById('favoritesDrawer');
    const backdrop = document.getElementById('favBackdrop');
    if (drawer) drawer.classList.add('show');
    if (backdrop) backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  };

  window.closeFavoritesDrawer = function () {
    const drawer = document.getElementById('favoritesDrawer');
    const backdrop = document.getElementById('favBackdrop');
    if (drawer) drawer.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };

  // 9. 一鍵複製所有行程清單
  window.copyAllFavorites = function () {
    const favs = getFavorites();
    if (favs.length === 0) {
      showTabiToast(coreText('home.nothingToExport', '收藏匣目前沒有景點可複製'), 'ℹ️');
      return;
    }
    const lines = [coreText('favorites.exportTitle', '我的日本行程清單（' + favs.length + ' 處）', { count: favs.length }), ''];
    favs.forEach((source, i) => {
      const item = TabiSpotI18n.favorite(source);
      lines.push(`${i + 1}. ${item.title} (${regionLabel(source.region)})`);
      if (item.desc) lines.push('   ' + coreText('favorites.description', '名所特色簡介') + ': ' + item.desc);
      if (source.mapcode) lines.push('   MapCode: ' + source.mapcode);
      if (item.location) lines.push('   ' + coreText('favorites.transit', '交通指南') + ': ' + item.location);
      if (item.tips) lines.push('   ' + coreText('favorites.tips', '觀測秘笈') + ': ' + item.tips);
      lines.push('');
    });
    lines.push(coreText('favorites.source', '來源：JAPAN TABI 日旅報報'));
    lines.push(window.location.href);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      showTabiToast(coreText('home.copiedCount', `成功複製 ${favs.length} 個景點攻略到剪貼簿！`, { count: favs.length }), '📋');
    }).catch(() => {
      showTabiToast(coreText('home.copyFailed', '複製失敗，請手動選取文字'), '⚠️');
    });
  };

  window.copyMyFavoritesItinerary = window.copyAllFavorites;

  // 10. 清空收藏匣
  window.clearAllFavorites = function () {
    const favs = getFavorites();
    if (favs.length === 0) return;
    if (confirm(coreText('home.clearConfirmCount', `確定要清空所有收藏的 ${favs.length} 個日本行程景點嗎？`, { count: favs.length }))) {
      saveFavorites([]);
      renderFavoritesList();
      showTabiToast(coreText('home.cleared', '已清空所有行程收藏'), '🗑️');
    }
  };

  // 11. 浮動 Toast 提示
  window.showTabiToast = function (msg, icon = '✦') {
    let container = document.getElementById('tabiToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'tabiToastContainer';
      container.className = 'tabi-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'tabi-toast';
    const iconEl = document.createElement('span');
    iconEl.style.fontSize = '15px';
    iconEl.textContent = icon;
    const messageEl = document.createElement('span');
    messageEl.textContent = msg;
    toast.append(iconEl, messageEl);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  };

  // 12. 全站通用：免稅日幣匯率試算計算機 (Global FX & Tax-Free Calculator)
  window.calculateFx = function () {
    const rateInput = document.getElementById('fxRateInput');
    const jpyInput = document.getElementById('fxJpyInput');
    if (!rateInput || !jpyInput) return;

    const rate = parseFloat(rateInput.value) || 0.215;
    const jpy = parseFloat(jpyInput.value) || 0;

    // 1. 一般含稅原價
    const normTwd = Math.round(jpy * rate);
    const normTwdEl = document.getElementById('fxNormTwd');
    const normJpyEl = document.getElementById('fxNormJpy');
    if (normTwdEl) normTwdEl.textContent = `NT$ ${normTwd.toLocaleString()}`;
    if (normJpyEl) normJpyEl.textContent = `含稅 ¥${Math.round(jpy).toLocaleString()}`;

    // Scenarios only: the actual shop determines eligibility, tax rate and fees.
    function estimate(divisor, twdId, jpyId) {
      const net = jpy / divisor;
      const eligibleAmount = net >= 5000;
      const estimateJpy = eligibleAmount ? Math.round(net) : Math.round(jpy);
      const twdEl = document.getElementById(twdId);
      const jpyEl = document.getElementById(jpyId);
      if (twdEl) twdEl.textContent = `NT$ ${Math.round(estimateJpy * rate).toLocaleString()}`;
      if (jpyEl) jpyEl.textContent = eligibleAmount ? `預估未稅 ¥${estimateJpy.toLocaleString()}（未扣手續費）` : '未達未稅 ¥5,000 門檻，按含稅金額顯示';
    }
    estimate(1.1, 'fxTaxFreeTwd', 'fxTaxFreeJpy');
    estimate(1.08, 'fxCouponTwd', 'fxCouponJpy');
  };

  window.setQuickJpy = function (val) {
    const input = document.getElementById('fxJpyInput');
    if (input) {
      input.value = val;
      window.calculateFx();
    }
  };

  window.openFxCalculator = function () {
    let modal = document.getElementById('fxCalculatorModal');
    let backdrop = document.getElementById('fxBackdrop');
    if (!modal) {
      if (typeof mountUI === 'function') mountUI();
      modal = document.getElementById('fxCalculatorModal');
      backdrop = document.getElementById('fxBackdrop');
    }
    if (modal) modal.classList.add('show');
    if (backdrop) backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
    if (typeof window.calculateFx === 'function') window.calculateFx();
  };

  window.closeFxCalculator = function () {
    const modal = document.getElementById('fxCalculatorModal');
    const backdrop = document.getElementById('fxBackdrop');
    if (modal) modal.classList.remove('show');
    if (backdrop) backdrop.classList.remove('show');
    document.body.style.overflow = '';
  };

  // 13. 自動掛載 DOM 元件 (Floating Hub, Favorites Drawer & FX Modal)
  function mountUI() {
    // (A) 檢查或注入浮動工具箱
    if (!document.getElementById('floatingQuickBar')) {
      const hub = document.createElement('div');
      hub.className = 'floating-square-hub';
      hub.id = 'floatingQuickBar';
      hub.innerHTML = `
        <span class="square-hub-badge" id="favCountBadge" style="display:none;">0</span>
        <button class="square-hub-item hub-item-fav" onclick="openFavoritesDrawer()" aria-label="查看我的日旅行程收藏本" data-i18n-aria-label="favorites.title" title="查看行程收藏本" data-i18n-title="favorites.title">
          <span class="hub-icon-wrap">${getHeartSvg(true, 14)}</span>
          <span class="hub-label" data-i18n="favorites.label">收藏</span>
        </button>
        <div class="square-hub-divider"></div>
        <button class="square-hub-item hub-item-fx" onclick="openFxCalculator()" aria-label="日幣即時匯率與10%免稅試算" data-i18n-aria-label="favorites.tax" title="日幣即時匯率與10%免稅試算" data-i18n-title="favorites.tax">
          <span class="hub-icon-wrap" style="font-size:14px; line-height:1;">💴</span>
          <span class="hub-label" data-i18n="favorites.tax">免稅</span>
        </button>
      `;
      document.body.appendChild(hub);
    } else {
      // 若已存在但使用了舊結構，校正按鈕與 icon
      const favBtn = document.querySelector('.floating-square-hub .hub-item-fav, .floating-square-hub button:first-of-type');
      if (favBtn) {
        const icon = favBtn.querySelector('.hub-icon, .hub-icon-wrap');
        if (icon) {
          icon.innerHTML = getHeartSvg(true, 14);
        }
      }
      const fxBtn = document.querySelector('.floating-square-hub .hub-item-fx, .floating-square-hub button:last-of-type');
      if (fxBtn && !fxBtn.hasAttribute('onclick')) {
        fxBtn.setAttribute('onclick', 'openFxCalculator()');
      }
    }

    // (B) 檢查或注入收藏抽屜
    if (!document.getElementById('favoritesDrawer')) {
      const backdrop = document.createElement('div');
      backdrop.className = 'fav-backdrop';
      backdrop.id = 'favBackdrop';
      backdrop.onclick = window.closeFavoritesDrawer;
      document.body.appendChild(backdrop);

      const drawer = document.createElement('div');
      drawer.className = 'fav-drawer';
      drawer.id = 'favoritesDrawer';
      drawer.innerHTML = `
        <div class="fav-drawer-header">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              ${getHeartSvg(true, 16)}
              <h3 style="font-size:1.1rem; font-weight:900; color:#1E293B; margin:0;" data-i18n="favorites.title">我的日旅行程收藏本</h3>
            </div>
            <div style="font-size:0.74rem; color:#64748B; margin-top:3px;" data-i18n="favorites.subtitle">
              免登入離線自動保存 ｜ 關閉視窗不遺失 ｜ 點擊卡片可展開完整攻略
            </div>
          </div>
          <button class="btn-fav-remove" onclick="closeFavoritesDrawer()" data-i18n-aria-label="favorites.close" style="font-size:18px; padding:6px 10px;">✕</button>
        </div>
        
        <div class="fav-drawer-body" id="favListContainer"></div>

        <div class="fav-drawer-footer">
          <button class="btn-fav-copy-all" onclick="copyAllFavorites()" data-i18n="favorites.export">
            📋 一鍵複製所有行程清單
          </button>
          <button class="btn-fav-clear" onclick="clearAllFavorites()" data-i18n="favorites.clear">
            全部清空
          </button>
        </div>
      `;
      document.body.appendChild(drawer);
    }

    // (C) 檢查或注入日幣匯率＆免稅試算小工具 Modal
    if (!document.getElementById('fxCalculatorModal')) {
      const fxBackdrop = document.createElement('div');
      fxBackdrop.className = 'fav-backdrop';
      fxBackdrop.id = 'fxBackdrop';
      fxBackdrop.onclick = window.closeFxCalculator;
      document.body.appendChild(fxBackdrop);

      const fxModal = document.createElement('div');
      fxModal.className = 'fx-calc-modal';
      fxModal.id = 'fxCalculatorModal';
      fxModal.innerHTML = `
        <div class="fx-calc-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:20px;">💴</span>
            <h3>日幣參考匯率 ＆ 退稅情境試算</h3>
          </div>
          <button class="btn-close-circle" onclick="closeFxCalculator()" aria-label="關閉試算小工具">✕</button>
        </div>

        <div class="fx-calc-body">
          <!-- 匯率基準 -->
          <div class="fx-rate-row">
            <span style="font-size:0.82rem; font-weight:700; color:#475569;">參考匯率 (1 JPY = ? TWD)：</span>
            <input type="number" id="fxRateInput" step="0.001" value="0.215" oninput="calculateFx()" class="fx-rate-field">
          </div>

          <!-- 輸入金額 -->
          <div style="margin:14px 0 8px;">
            <label style="font-size:0.8rem; font-weight:800; color:#334155;">輸入商品含稅日圓金額 (JPY ¥)：</label>
            <div class="fx-input-wrap">
              <span class="fx-curr-symbol">¥</span>
              <input type="number" id="fxJpyInput" value="10000" placeholder="例如 10000" oninput="calculateFx()" class="fx-amount-input">
            </div>
          </div>

          <!-- 快捷金額標籤 -->
          <div class="fx-quick-tags">
            <button onclick="setQuickJpy(1000)">¥1,000</button>
            <button onclick="setQuickJpy(5500)">¥5,500 (10% 稅率示例)</button>
            <button onclick="setQuickJpy(10000)">¥10,000</button>
            <button onclick="setQuickJpy(30000)">¥30,000</button>
            <button onclick="setQuickJpy(50000)">¥50,000</button>
            <button onclick="setQuickJpy(100000)">¥100,000</button>
          </div>

          <!-- 試算結果卡片 -->
          <div class="fx-result-grid">
            <!-- 1. 一般含稅原價 -->
            <div class="fx-card fx-card-normal">
              <div class="fx-card-lbl">一般含稅原價</div>
              <div>
                <div class="fx-card-twd" id="fxNormTwd">NT$ 2,150</div>
                <div class="fx-card-jpy" id="fxNormJpy">約 ¥10,000</div>
              </div>
            </div>

            <!-- 2. 日本 10% 退稅價 -->
            <div class="fx-card fx-card-taxfree">
              <div class="fx-card-lbl">一般稅率 10%：預估未稅金額</div>
              <div>
                <div class="fx-card-twd text-emerald" id="fxTaxFreeTwd">NT$ 1,955</div>
                <div class="fx-card-jpy" id="fxTaxFreeJpy">預估未稅 ¥9,091（未扣手續費）</div>
              </div>
            </div>

            <!-- 3. Reduced-rate scenario -->
            <div class="fx-card fx-card-coupon">
              <div class="fx-card-lbl">輕減稅率 8%：預估未稅金額</div>
              <div>
                <div class="fx-card-twd text-rose" id="fxCouponTwd">NT$ 1,991</div>
                <div class="fx-card-jpy" id="fxCouponJpy">預估未稅 ¥9,259（未扣手續費）</div>
              </div>
            </div>
          </div>

          <div class="fx-tax-tip">
            💡 <b>2026-11-01 起適用退稅制：</b>購買時先支付含稅價格，符合資格且同店同日未稅合計滿 ¥5,000，並在購買起 90 日內取得海關攜出確認後，由店家或受託業者退款。10% 與 8% 為不同商品稅率的情境示例，不能相加；未扣退款費用，也不保證取得優惠券。實際稅率、資格及費用請向店家確認。
          </div>
        </div>
      `;
      document.body.appendChild(fxModal);
    }

    updateFavoriteBadge();
    refreshFavoriteLanguage();
  }


  // 15. 全球化智慧多國語系外跳分潤攔截與路由對齊引擎 (Affiliate & Geo-Routing Engine)
  function initAffiliateRouter() {
    // 取得當前用戶語系：先讀 localStorage，次讀 navigator.language
    function detectUserLocale() {
      return TabiLang.get().toLowerCase();
    }

    // 監聽全站所有點擊連結事件
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || !a.href) return;
      var href = a.href;
      if (href.startsWith('javascript:') || href.startsWith('#')) return;

      var locale = detectUserLocale();
      var isWesternOrGlobal = (locale === 'en' || locale === 'th' || locale === 'ko' || locale === 'ja');

      // (A) Trip.com 智慧路由與分潤掛碼
      if (href.indexOf('trip.com') > -1) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        // 若為官方短網址則保留快速跳轉
        if (href.indexOf('/t/fgyJcXow1X2') > -1) return;

        var tripDomains = {
          'zh-tw': 'https://tw.trip.com',
          'zh-cn': 'https://hk.trip.com',
          'en': 'https://www.trip.com',
          'ja': 'https://jp.trip.com',
          'th': 'https://th.trip.com',
          'ko': 'https://kr.trip.com'
        };
        var targetDomain = tripDomains[locale] || (isWesternOrGlobal ? 'https://www.trip.com' : 'https://tw.trip.com');

        // 置換主網域為對應語系站
        var newHref = href.replace(/https:\/\/(tw|jp|th|kr|hk|www)\.trip\.com/, targetDomain);
        if (!newHref.startsWith('http')) newHref = targetDomain + newHref;

        // 注入四大主力 ID
        if (newHref.indexOf('Allianceid=') === -1) {
          var sep = newHref.indexOf('?') > -1 ? '&' : '?';
          newHref += sep + 'Allianceid=9507030&SID=325761227&trip_sub1=%E6%97%A5%E6%9C%AC%E5%A0%B1%E5%A0%B1&trip_sub3=D20272275';
        } else {
          // 若有舊的 D20905663 或其他 trip_sub3，統一校正為規格書之 D20272275
          newHref = newHref.replace(/trip_sub3=[A-Za-z0-9_]+/, 'trip_sub3=D20272275');
        }
        a.href = newHref;
      }

      // (B) Klook 景點/體驗/包車/Pass 自動掛碼 aid=123436
      else if (href.indexOf('klook.com') > -1) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        var klookLocales = {
          'zh-tw': 'zh-TW',
          'zh-cn': 'zh-CN',
          'en': 'en-US',
          'ja': 'ja',
          'th': 'th',
          'ko': 'ko'
        };
        var targetKlookLoc = klookLocales[locale] || (isWesternOrGlobal ? 'en-US' : 'zh-TW');

        var newHref = href.replace(/klook\.com\/[a-zA-Z_\-]+(\/|$)/, 'klook.com/' + targetKlookLoc + '/');
        if (newHref.indexOf('aid=') === -1) {
          var sep = newHref.indexOf('?') > -1 ? '&' : '?';
          newHref += sep + 'aid=123436&utm_medium=affiliate-alwayson';
        }
        a.href = newHref;
      }

      // (C) Rakuten Travel / 日本樂天 自動掛碼 592df26a.c525acf4.592df26b.012fa32d
      else if (href.indexOf('rakuten.co.jp') > -1) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        if (href.indexOf('hb.afl.rakuten.co.jp') === -1 && href.indexOf('592df26a.c525acf4.592df26b.012fa32d') === -1) {
          var encodedTarget = encodeURIComponent(href);
          a.href = 'https://hb.afl.rakuten.co.jp/ichiba/592df26a.c525acf4.592df26b.012fa32d/?pc=' + encodedTarget;
        }
      }

      // (D) Booking.com language routing with an independent currency default
      else if (href.indexOf('booking.com') > -1) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';

        // 若為歐美旅客 (en) 且有指定 Travelpayouts 專屬短鏈 KhRuaSJR，亦可支援導流
        var bookingLocs = {
          'zh-tw': 'zh-tw',
          'zh-cn': 'zh-cn',
          'en': 'en-gb',
          'ja': 'ja',
          'th': 'th',
          'ko': 'ko'
        };
        var bLoc = bookingLocs[locale] || 'zh-tw';
        var bCur = 'TWD'; // Display language does not select a currency.

        var newHref = href.replace(/searchresults\.[a-z\-]+\.html/, 'searchresults.' + bLoc + '.html');
        if (newHref.indexOf('selected_currency=') === -1) {
          var sep = newHref.indexOf('?') > -1 ? '&' : '?';
          newHref += sep + 'selected_currency=' + bCur;
        }
        a.href = newHref;
      }
    }, true);
  }

  function refreshFavoriteLanguage() {
    updateAllHeartButtons();
    renderFavoritesList();
    const drawer = document.getElementById('favoritesDrawer');
    if (drawer) TabiLang.render(drawer);
    const hub = document.getElementById('floatingQuickBar');
    if (hub) TabiLang.render(hub);
  }
  TabiLang.onChange(refreshFavoriteLanguage);
  TabiSpotI18n.ready.then(refreshFavoriteLanguage);
  document.addEventListener('DOMContentLoaded', refreshFavoriteLanguage);

  // 14. 官方防盜版、著作權防護與轉載追蹤
  function initCopyrightProtection() {
    // 禁止在圖片與文章卡片上按右鍵盜圖
    document.addEventListener('contextmenu', function (e) {
      const target = e.target;
      if (target.tagName === 'IMG' || target.closest('.spot-card, .rank-4col-card, .rank-top3-card, .train-wanderly-card, .bloom-card, .cafe-story-card')) {
        e.preventDefault();
        showTabiToast('【日旅報報 JAPAN TABI】現地取材原創內容受著作權保護，未經授權禁止盜用', '🛡️');
      }
    });

    // 複製文字時自動附加官方著作權來源與出處網址
    document.addEventListener('copy', function (e) {
      const selection = window.getSelection();
      if (!selection || selection.toString().length < 35) return;
      const text = selection.toString();
      const attribution = `\n\n--------------------\n來源：《日旅報報 JAPAN TABI》公式觀測現地取材認證\n原文網址：${window.location.href}\n全站圖文著作權所有，未經許可請勿轉載或進行商業二次利用。`;
      
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', text + attribution);
        e.preventDefault();
      }
    });

    // 防止惡意 iframe 內嵌 (Clickjacking Protection)
    try {
      if (window.top !== window.self) {
        window.top.location = window.self.location;
      }
    } catch (e) {
      console.warn('[TABI] Frame check caught');
    }

    // 控制台官方防偽浮水印
    console.log(
      "%c JAPAN TABI 公式觀測 %c 本站所有現地取材照片與特派員報導受法律嚴密保護，未經書面許可禁止轉載、抓取與抄襲盜用。",
      "background:#BE123C; color:#FFFFFF; font-weight:bold; font-size:12px; padding:4px 8px; border-radius:4px;",
      "color:#0F172A; font-weight:bold; font-size:12px; margin-left:6px;"
    );
  }

  // DOM 載入後自動掛載
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountUI();
      initCopyrightProtection();
      initAffiliateRouter();
    });
  } else {
    mountUI();
    initCopyrightProtection();
    initAffiliateRouter();
  }

  // 全域暴露
  window.getHeartSvg = getHeartSvg;
  window.getFavorites = getFavorites;
  window.isFavorite = isFavorite;
})();

/* ==========================================================================
   全站統一 Header 多國語系下拉選單 (toggleLangDropdown / selectLanguage)
   ========================================================================== */
(function () {
  function closeMenu() {
    var menu = document.getElementById('langDropdownMenu');
    var wrap = document.getElementById('langSelectorWrap');
    if (menu) menu.classList.remove('show');
    if (wrap) wrap.classList.remove('open');
  }

  if (typeof window.toggleLangDropdown !== 'function') window.toggleLangDropdown = function (event) {
    if (event) event.stopPropagation();
    var menu = document.getElementById('langDropdownMenu');
    var wrap = document.getElementById('langSelectorWrap');
    if (!menu) return;
    var show = menu.classList.toggle('show');
    if (wrap) wrap.classList.toggle('open', show);
  };

  // One entry point for headers and article language pills.
  var articleRenderer = window.setArticleLang;
  function renderLanguage(language) {
    if (articleRenderer) {
      var key = language.toLowerCase();
      articleRenderer(key, document.querySelector('.btn-trans-choice[data-lang="' + key + '"]'));
    }
    if (typeof window.TabiOnLanguageChange === 'function') {
      window.TabiOnLanguageChange(language, TabiLang.names[language]);
    }
    TabiLang.refresh();
  }
  if (articleRenderer) window.setArticleLang = function (language) {
    var normalized = TabiLang.normalize(language);
    if (normalized === TabiLang.get()) renderLanguage(normalized);
    else TabiLang.set(language);
  };
  window.selectLanguage = function (language) {
    TabiLang.set(language);
    closeMenu();
  };
  TabiLang.onChange(renderLanguage);
  document.addEventListener('DOMContentLoaded', function () {
    renderLanguage(TabiLang.get());
  });

  window.addEventListener('click', function (e) {
    var wrap = document.getElementById('langSelectorWrap');
    var menu = document.getElementById('langDropdownMenu');
    if (wrap && menu && !wrap.contains(e.target)) {
      menu.classList.remove('show');
      wrap.classList.remove('open');
    }
  });
})();
