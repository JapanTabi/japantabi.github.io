/* 全站共用語系：使用標準語言代碼，兼容既有小寫資料鍵。
 * 用法：載入後，頁面可使用 TabiLang.get() / TabiLang.set(lang) / TabiLang.t(key) / TabiLang.onChange(fn)
 * 語言來源優先序：網址 ?lang= > localStorage.tabi_selected_lang（自動遷移 current_lang） > 瀏覽器語言 > zh-tw
 */
(function () {
  var SUPPORTED;
  var listeners = [];

  // Minimal source-language fallback keeps dynamic UI usable if the dictionary request fails.
  var sourceMessages = {
    "siteName": "日本報報",
    "articlesTitle": "深度文章庫",
    "articlesSub": "專為台灣旅客整理的日本深度特刊",
    "filterAll": "全部文章",
    "empty": "此語言目前尚無文章，敬請期待。",
    "read": "閱讀全文",
    "min": "分鐘閱讀",
    "book": "預訂優惠",
    "allLevels": "全部難度",
    "footer": "© 2026 日本報報 ｜ 本站含 Trip.com 聯盟連結，訂購可能為本站帶來分潤，不影響您的價格。",
    "langLabel": "語言",
    "home": "返回首頁",
    "cat.ski": "⛷️ 滑雪",
    "cat.flower": "🌸 賞花",
    "cat.themepark": "🎡 遊樂園",
    "cat.food": "🍜 美食",
    "cat.transit": "🚆 交通",
    "weather.loading": "載入中...",
    "weather.error": "天氣資料暫時無法載入，請稍後再試",
    "weather.noTemperature": "氣溫暫無資料",
    "weather.rain": "降雨機率 {pop}"
  };
  var messages = {};
  var domReady = false;
  var hasMessages = false;
  // Resolve against this script, so / and GitHub Pages subpaths use the same bundle.
  var messagesUrl = new URL('../data/ui_translations.json', document.currentScript.src);

  var NAMES = {
    'zh-TW': '繁體中文', 'zh-CN': '简体中文', 'en': 'English',
    'ja': '日本語', 'ko': '한국어', 'th': 'ไทย',
    'vi': 'Tiếng Việt', 'hi': 'हिन्दी', 'es': 'Español'
  };
  var FLAGS = {
    'zh-TW': '🇹🇼', 'zh-CN': '🇨🇳', 'en': '🇺🇸',
    'ja': '🇯🇵', 'ko': '🇰🇷', 'th': '🇹🇭',
    'vi': '🇻🇳', 'hi': '🇮🇳', 'es': '🇪🇸'
  };
  SUPPORTED = Object.keys(NAMES);
  var STORAGE_KEY = 'tabi_selected_lang';
  function normalize(value) {
    var l = String(value || '').replace(/_/g, '-').toLowerCase();
    if (/^zh-(cn|sg|hans)(-|$)/.test(l)) return 'zh-CN';
    if (l === 'zh' || /^zh-(tw|hk|mo|hant)(-|$)/.test(l)) return 'zh-TW';
    var base = l.split('-')[0];
    return SUPPORTED.indexOf(base) >= 0 ? base : null;
  }
  function detect() {
    var q = normalize(new URLSearchParams(location.search).get('lang'));
    if (q) return q;
    var pageLanguage = normalize(document.documentElement.dataset.pageLanguage);
    if (pageLanguage) return pageLanguage;
    try {
      var saved = normalize(localStorage.getItem(STORAGE_KEY)) || normalize(localStorage.getItem('current_lang'));
      if (saved) return saved;
    } catch (e) {}
    return normalize(navigator.language) || 'zh-TW';
  }
  var current = detect();
  function translate(key, params) {
    var template = (messages[current] || {})[key] || (messages['zh-TW'] || {})[key] || key;
    return template.replace(/\{(\w+)\}/g, function (match, name) {
      return params && Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match;
    });
  }
  function renderTexts(root) {
    if (!hasMessages) return;
    var scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var text = translate(el.dataset.i18n);
      if (text !== el.dataset.i18n && el.textContent !== text) el.textContent = text;
    });
    ['title', 'aria-label', 'alt', 'placeholder', 'content'].forEach(function (attribute) {
      scope.querySelectorAll('[data-i18n-' + attribute + ']').forEach(function (el) {
        var key = el.getAttribute('data-i18n-' + attribute);
        var text = translate(key);
        if (text !== key) el.setAttribute(attribute, text);
      });
    });
  }
  function notifyListeners() {
    listeners.forEach(function (fn) { fn(current); });
    renderTexts();
  }
  function syncState() {
    try {
      localStorage.setItem(STORAGE_KEY, current);
      localStorage.removeItem('current_lang');
    } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set('lang', current);
    history.replaceState(null, '', u.toString());
    document.documentElement.lang = current;
    renderTexts();
    var label = document.getElementById('currentLangLabel');
    if (label) label.textContent = NAMES[current];
    document.querySelectorAll('.lang-menu-opt, .btn-trans-choice').forEach(function (el) {
      var active = normalize(el.dataset.lang) === current;
      el.classList.toggle('active', active);
      var check = el.querySelector('.lang-check');
      if (check) check.textContent = active ? '✓' : '';
    });
  }
  function apply(lang) {
    lang = normalize(lang);
    if (!lang) return;
    var changed = current !== lang;
    current = lang;
    syncState();
    if (changed && hasMessages) notifyListeners();
  }
  function mountFooterLanguageSelector() {
    if (document.getElementById('footerLangSwitch')) return;
    var backToTop = Array.from(document.querySelectorAll('button[onclick]')).find(function (button) {
      return /window\.scrollTo\(\{\s*top\s*:\s*0/.test(button.getAttribute('onclick') || '');
    });
    if (!backToTop) return;

    var style = document.createElement('style');
    style.textContent = '.tabi-footer-actions{display:inline-flex;align-items:center;gap:12px;flex-shrink:0}.tabi-footer-lang{display:inline-flex;align-items:center}.tabi-footer-lang select{appearance:auto;background:#fff;border:1px solid #CBD5E1;border-radius:999px;padding:6px 12px;color:#334155;font:700 .82rem/1.25 inherit;cursor:pointer;max-width:150px}.tabi-footer-lang select:hover,.tabi-footer-lang select:focus{border-color:#92400E;color:#92400E;outline:none}';
    document.head.appendChild(style);

    var wrapper = document.createElement('span');
    wrapper.className = 'tabi-footer-lang';
    wrapper.setAttribute('data-i18n-skip', '');
    var select = document.createElement('select');
    select.id = 'footerLangSwitch';
    select.setAttribute('aria-label', 'Language');
    SUPPORTED.forEach(function (language) {
      var option = document.createElement('option');
      option.value = language;
      option.textContent = FLAGS[language] + ' ' + NAMES[language];
      select.appendChild(option);
    });
    select.value = current;
    select.addEventListener('change', function () { apply(select.value); });
    wrapper.appendChild(select);
    var actions = document.createElement('span');
    actions.className = 'tabi-footer-actions';
    backToTop.before(actions);
    actions.append(wrapper, backToTop);
    listeners.push(function (language) { select.value = language; });
  }
  window.TabiLang = {
    SUPPORTED: SUPPORTED,
    names: NAMES,
    normalize: normalize,
    get: function () { return current; },
    set: apply,
    t: translate,
    render: renderTexts,
    cat: function (c) { return translate('cat.' + c); },
    onChange: function (fn) { listeners.push(fn); },
    refresh: syncState,
    init: function () { syncState(); if (hasMessages) notifyListeners(); }
  };
  window.TabiLang.ready = fetch(messagesUrl, { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('UI translations: ' + response.status);
      return response.json();
    })
    .then(function (data) {
      messages = data;
      hasMessages = true;
      document.documentElement.dataset.i18nState = 'ready';
      if (domReady) {
        syncState();
        notifyListeners();
      }
      return true;
    })
    .catch(function (error) {
      messages = { 'zh-TW': sourceMessages };
      hasMessages = true;
      // A partial dictionary must never leave dynamically rendered controls in
      // the requested language: sourceMessages only contains Traditional
      // Chinese.  Switch the shared language state before page listeners run.
      current = 'zh-TW';
      document.documentElement.dataset.i18nState = 'fallback';
      if (domReady) {
        syncState();
        notifyListeners();
      }
      console.warn('UI translations could not be loaded:', error);
      return false;
    });
  // Persist detection before page-specific scripts read the preference.
  syncState();
  document.addEventListener('DOMContentLoaded', function () {
    domReady = true;
    mountFooterLanguageSelector();
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      sourceMessages[el.dataset.i18n] = el.textContent.trim();
    });
    ['title', 'aria-label', 'alt', 'placeholder', 'content'].forEach(function (attribute) {
      document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(function (el) {
        var key = el.getAttribute('data-i18n-' + attribute);
        if (!sourceMessages[key]) sourceMessages[key] = el.getAttribute(attribute);
      });
    });
    var menu = document.getElementById('langDropdownMenu');
    if (menu) SUPPORTED.forEach(function (language) {
      if (Array.from(menu.querySelectorAll('[data-lang]')).some(function (el) {
        return normalize(el.dataset.lang) === language;
      })) return;
      var button = document.createElement('button');
      button.className = 'lang-menu-opt';
      button.dataset.lang = language;
      var flag = document.createElement('span');
      flag.className = 'lang-flag';
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = FLAGS[language];
      var name = document.createElement('span');
      name.className = 'lang-name';
      name.textContent = NAMES[language];
      var check = document.createElement('span');
      check.className = 'lang-check';
      button.append(flag, name, check);
      button.addEventListener('click', function () { window.selectLanguage(language, NAMES[language]); });
      menu.appendChild(button);
    });
    syncState();
    if (hasMessages) notifyListeners();
  });
})();
