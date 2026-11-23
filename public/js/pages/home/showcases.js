// Keep source facts and links separate from the translated card copy.
(function () {
  var groups = {
    hot_springs: { container: 'hotSpringCardsScroller', notice: 'hotSpringTranslationNotice', fields: ['name', 'spring_quality', 'highlights', 'day_trip'] },
    festivals: { container: 'festivalCardsScroller', notice: 'festivalTranslationNotice', fields: ['name', 'date_display', 'shots', 'badge', 'highlights', 'reserved_seats', 'transit'] }
  };
  var prefectures = {
    '群馬縣': 'gunma', '神奈川縣': 'kanagawa', '兵庫縣': 'hyogo', '大分縣': 'oita',
    '岐阜縣': 'gifu', '北海道': 'hokkaido', '熊本縣': 'kumamoto', '山形縣': 'yamagata',
    '新潟縣': 'niigata', '秋田縣': 'akita', '東京都': 'tokyo', '大阪府': 'osaka',
    '靜岡縣': 'shizuoka', '京都府': 'kyoto'
  };
  var translations = {};
  var translationsPending = true;
  var states = {};

  function text(key, source, params) {
    var value = TabiLang.t(key, params);
    return value === key ? source : value;
  }
  function field(card, name, value) {
    card.querySelector('[data-field="' + name + '"]').textContent = value;
  }
  function sourceCopy(group, record) {
    var result = {};
    groups[group].fields.forEach(function (name) {
      result[name] = name === 'badge' ? String(record.scale || '').split('・')[0] : record[name];
    });
    return result;
  }
  function renderCard(group, source) {
    var language = TabiLang.get();
    var entry = ((translations[language] || {})[group] || {})[source.id];
    var complete = language === 'zh-TW' || groups[group].fields.every(function (name) {
      return entry && typeof entry[name] === 'string' && entry[name].trim();
    });
    var copy = language !== 'zh-TW' && complete ? entry : sourceCopy(group, source);
    var card = document.createElement('article');
    card.className = 'showcase-card';
    card.dataset.showcaseId = source.id;
    card.dataset.translationState = complete ? 'translated' : 'source';
    card.lang = complete ? language : 'zh-TW';
    // Only the template is HTML. All source and translated values are assigned as text.
    card.innerHTML = '<div class="showcase-image-wrap"><img loading="lazy"><span class="showcase-badge"></span></div>' +
      '<div class="showcase-body"><h3 data-field="name"></h3><span class="showcase-original" lang="ja"></span>' +
      '<div class="showcase-meta" data-field="meta"></div><p class="showcase-description" data-field="highlights"></p>' +
      '<div class="showcase-detail"><strong class="showcase-detail-label"></strong><span data-field="detail"></span></div></div>';
    var image = card.querySelector('img');
    image.src = source.image;
    image.alt = copy.name;
    field(card, 'name', copy.name);
    field(card, 'highlights', copy.highlights);
    card.querySelector('[data-field="highlights"]').title = copy.highlights;
    var original = card.querySelector('.showcase-original');
    original.textContent = source.jp || '';
    original.hidden = !source.jp || source.jp === copy.name;
    var pref = text('pref.' + prefectures[source.pref], source.pref);
    var badge = card.querySelector('.showcase-badge');
    var body = card.querySelector('.showcase-body');
    var label = card.querySelector('.showcase-detail-label');
    label.lang = language;
    if (group === 'hot_springs') {
      badge.textContent = '#' + source.rank + ' ' + pref;
      badge.lang = language;
      field(card, 'meta', copy.spring_quality);
      label.textContent = '♨️ ' + text('showcase.dayTrip', '日歸推薦') + ': ';
      field(card, 'detail', copy.day_trip);
      var link = document.createElement('a');
      link.className = 'showcase-booking';
      link.lang = language;
      link.href = 'https://tw.trip.com/?Allianceid=9507030&SID=325761227&trip_sub1=' + encodeURIComponent(source.booking_keyword);
      link.target = '_blank';
      link.rel = 'noopener sponsored';
      link.textContent = text('showcase.stay', '查詢 ' + copy.name + ' 一泊二食空房 ➔', { name: copy.name });
      body.appendChild(link);
    } else {
      badge.textContent = copy.badge + ' ｜ ' + copy.date_display;
      card.classList.add('showcase-festival');
      var location = document.createElement('span');
      location.className = 'showcase-location';
      location.lang = language;
      location.textContent = pref;
      card.querySelector('[data-field="name"]').after(location);
      var program = document.createElement('span');
      program.lang = language;
      program.textContent = text(source.id === 'gion_festival' ? 'showcase.program' : 'showcase.shots', source.id === 'gion_festival' ? '節目類型' : '煙火發數') + ': ';
      var shots = card.querySelector('[data-field="meta"]');
      shots.appendChild(program);
      var count = document.createElement('span');
      count.dataset.field = 'shots';
      count.textContent = copy.shots;
      shots.appendChild(count);
      label.textContent = text('showcase.seating', '觀賞席') + ': ';
      field(card, 'detail', copy.reserved_seats);
      var transit = document.createElement('p');
      transit.className = 'showcase-transit';
      transit.dataset.field = 'transit';
      transit.textContent = '🚇 ' + copy.transit;
      body.appendChild(transit);
      if (source.official_url) { var official = document.createElement('a'); official.href = source.official_url; official.textContent = text('showcase.official', '查看官方日期與活動公告'); official.target = '_blank'; official.rel = 'noopener noreferrer'; body.appendChild(official); }
    }
    return card;
  }
  function render(group) {
    var config = groups[group];
    var container = document.getElementById(config.container);
    if (!container) return;
    var notice = document.getElementById(config.notice);
    if (notice) notice.hidden = true;
    var state = states[group];
    var status = state.error ? 'error' : !state.records || translationsPending ? 'loading' : !state.records.length ? 'empty' : 'ready';
    container.dataset.state = status;
    container.setAttribute('aria-busy', String(status === 'loading'));
    if (status !== 'ready') {
      var message = document.createElement('p');
      message.className = 'showcase-state';
      message.setAttribute('role', 'status');
      message.textContent = text('showcase.' + status, { error: '暫時無法載入，請稍後再試。', loading: '載入中…', empty: '目前沒有資料。' }[status]);
      container.replaceChildren(message);
      return;
    }
    var scroll = container.scrollLeft;
    var cards = state.records.map(function (record) { return renderCard(group, record); });
    container.replaceChildren.apply(container, cards);
    container.scrollLeft = scroll;
    if (notice && TabiLang.get() !== 'zh-TW' && cards.some(function (card) { return card.dataset.translationState === 'source'; })) {
      notice.textContent = text('showcase.sourceNotice', '部分內容以原文顯示。');
      notice.hidden = false;
    }
  }
  function renderAll() { Object.keys(groups).forEach(render); }
  function load(url) {
    return fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) }).then(function (response) {
      if (!response.ok) throw new Error(url + ': ' + response.status);
      return response.json();
    });
  }
  Object.keys(groups).forEach(function (group) {
    states[group] = { records: null, error: false };
    load('data/' + group + '.json').then(function (records) {
      if (!Array.isArray(records) || records.some(function (record) { return !record || typeof record.id !== 'string' || !record.name; })) {
        throw new Error('Invalid showcase source: ' + group);
      }
      states[group].records = records;
    }).catch(function (error) {
      states[group].error = true;
      console.debug('Showcase source unavailable:', error);
    }).finally(function () { render(group); });
  });
  load('data/home_showcase_translations.json').then(function (data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid showcase translations');
    translations = data;
  }).catch(function (error) {
    console.debug('Showcase translations unavailable:', error);
  }).finally(function () {
    translationsPending = false;
    renderAll();
  });
  TabiLang.onChange(renderAll);
  TabiLang.ready.then(renderAll);
  renderAll();
})();
