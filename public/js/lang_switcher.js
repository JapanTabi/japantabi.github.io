/* 全站共用語系：使用標準語言代碼，兼容既有小寫資料鍵。
 * 用法：載入後，頁面可使用 TabiLang.get() / TabiLang.set(lang) / TabiLang.t(key) / TabiLang.onChange(fn)
 * 語言來源優先序：網址 ?lang= > localStorage.tabi_selected_lang（自動遷移 current_lang） > 瀏覽器語言 > zh-tw
 */
(function () {
  var SUPPORTED = ["zh-tw", "en", "ja"];
  var listeners = [];

  var DICT = {
    "zh-tw": {
      siteName: "日本報報", articlesTitle: "深度文章庫", articlesSub: "專為台灣旅客整理的日本深度特刊",
      filterAll: "全部文章", empty: "此語言目前尚無文章，敬請期待。", read: "閱讀全文", min: "分鐘閱讀", book: "預訂優惠",
      allLevels: "全部難度", footer: "© 2026 日本報報 ｜ 本站含 Trip.com 聯盟連結，訂購可能為本站帶來分潤，不影響您的價格。",
      langLabel: "語言", home: "返回首頁",
      cat: { ski: "⛷️ 滑雪", flower: "🌸 賞花", themepark: "🎡 遊樂園", food: "🍜 美食", transit: "🚆 交通" }
    },
    "en": {
      siteName: "Japan Tabi Report", articlesTitle: "Deep-Dive Articles", articlesSub: "In-depth Japan travel features written for international travelers",
      filterAll: "All Articles", empty: "No articles in this language yet. Coming soon.", read: "Read more", min: "min read", book: "Book now",
      allLevels: "All Levels", footer: "© 2026 Japan Tabi Report | This site contains Trip.com affiliate links. We may earn a commission at no extra cost to you.",
      langLabel: "Language", home: "Back to Home",
      cat: { ski: "⛷️ Ski", flower: "🌸 Blossoms", themepark: "🎡 Theme Parks", food: "🍜 Food", transit: "🚆 Transit" }
    },
    "ja": {
      siteName: "日本報報", articlesTitle: "ディープ記事ライブラリ", articlesSub: "日本の旅をもっと深く楽しむための特集記事",
      filterAll: "すべての記事", empty: "この言語の記事はまだありません。近日公開予定です。", read: "続きを読む", min: "分で読める", book: "予約はこちら",
      allLevels: "すべての難易度", footer: "© 2026 日本報報 ｜ 当サイトには Trip.com のアフィリエイトリンクが含まれます。ご予約により当サイトに報酬が発生する場合がありますが、価格には影響しません。",
      langLabel: "言語", home: "ホームへ戻る",
      cat: { ski: "⛷️ スキー", flower: "🌸 花見", themepark: "🎡 テーマパーク", food: "🍜 グルメ", transit: "🚆 交通" }
    }
  };

  var NAMES = {
    'zh-TW': '繁體中文', 'zh-CN': '简体中文', 'en': 'English',
    'ja': '日本語', 'ko': '한국어', 'th': 'ไทย',
    'vi': 'Tiếng Việt', 'hi': 'हिन्दी', 'es': 'Español'
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
    try {
      var saved = normalize(localStorage.getItem(STORAGE_KEY)) || normalize(localStorage.getItem('current_lang'));
      if (saved) return saved;
    } catch (e) {}
    return normalize(navigator.language) || 'zh-TW';
  }
  var current = detect();
  function syncState() {
    try {
      localStorage.setItem(STORAGE_KEY, current);
      localStorage.removeItem('current_lang');
    } catch (e) {}
    var u = new URL(location.href);
    u.searchParams.set('lang', current);
    history.replaceState(null, '', u.toString());
    document.documentElement.lang = current;
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
    if (changed) listeners.forEach(function (fn) { fn(current); });
  }
  function dictionary() { return DICT[current.toLowerCase()] || DICT['zh-tw']; }
  window.TabiLang = {
    SUPPORTED: SUPPORTED,
    names: NAMES,
    normalize: normalize,
    get: function () { return current; },
    set: apply,
    t: function (key) { return dictionary()[key] || DICT['zh-tw'][key] || key; },
    cat: function (c) { return dictionary().cat[c] || DICT['zh-tw'].cat[c] || c; },
    onChange: function (fn) { listeners.push(fn); },
    refresh: syncState,
    init: function () { syncState(); listeners.forEach(function (fn) { fn(current); }); }
  };
  // Persist detection before page-specific scripts read the preference.
  syncState();
  document.addEventListener('DOMContentLoaded', function () {
    var menu = document.getElementById('langDropdownMenu');
    if (menu) SUPPORTED.forEach(function (language) {
      if (Array.from(menu.querySelectorAll('[data-lang]')).some(function (el) {
        return normalize(el.dataset.lang) === language;
      })) return;
      var button = document.createElement('button');
      button.className = 'lang-menu-opt';
      button.dataset.lang = language;
      button.textContent = NAMES[language];
      button.addEventListener('click', function () { window.selectLanguage(language, NAMES[language]); });
      menu.appendChild(button);
    });
    syncState();
  });
})();
