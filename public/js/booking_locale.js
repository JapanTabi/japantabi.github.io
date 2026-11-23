/* Provider languages are explicit; currency and affiliate parameters are preserved. */
(function () {
  'use strict';
  var trip = {
    'zh-TW': ['tw.trip.com', 'zh-TW'], 'zh-CN': ['www.trip.com', 'zh-CN'],
    en: ['www.trip.com', 'en-US'], ja: ['jp.trip.com', 'ja-JP'], ko: ['kr.trip.com', 'ko-KR'],
    th: ['th.trip.com', 'th-TH'], vi: ['vn.trip.com', 'vi-VN'], hi: ['www.trip.com', 'en-IN'], es: ['es.trip.com', 'es-ES']
  };
  var klook = {'zh-TW':'zh-TW','zh-CN':'zh-CN',en:'en-US',ja:'ja',ko:'ko',th:'th',vi:'vi',hi:'en-US',es:'es'};
  var booking = {'zh-TW':'zh-tw','zh-CN':'zh-cn',en:'en-gb',ja:'ja',ko:'ko',th:'th',vi:'vi',hi:'hi',es:'es'};
  function localize(raw, lang) {
    if (!raw) return raw;
    var url;
    try { url = new URL(raw, location.href); } catch (_) { return raw; }
    lang = lang || TabiLang.get();
    if (!/^https?:$/.test(url.protocol)) return raw;
    if (/(^|\.)trip\.com$/i.test(url.hostname)) {
      // Provider short links are opaque redirects; never rewrite their path or host.
      if (/^\/t\//.test(url.pathname)) return raw;
      var target = trip[lang] || trip.en;
      url.hostname = target[0]; url.searchParams.set('locale', target[1]);
    } else if (/(^|\.)klook\.com$/i.test(url.hostname)) {
      var parts = url.pathname.split('/');
      if (/^[a-z]{2}(?:[-_][a-z]{2})?$/i.test(parts[1])) parts[1] = klook[lang] || 'en-US';
      else parts.splice(1, 0, klook[lang] || 'en-US');
      url.pathname = parts.join('/');
    } else if (/(^|\.)booking\.com$/i.test(url.hostname)) {
      url.pathname = url.pathname.replace(/searchresults\.[a-z-]+\.html/i, 'searchresults.' + booking[lang] + '.html');
      url.searchParams.set('lang', booking[lang] || 'en-gb');
    } else return raw;
    return url.href;
  }
  window.TabiBookingLocale = { url: localize, fallback: function (provider, language) { return language === 'hi' && (provider === 'trip' || provider === 'klook') ? 'en' : language; } };
  document.addEventListener('DOMContentLoaded', function () {
    // Window bubbling runs after legacy page-level affiliate handlers.
    window.addEventListener('click', function (event) {
      var a = event.target.closest && event.target.closest('a[href]');
      if (a) a.href = localize(a.href);
    });
    ['buildTripUrl', 'buildTripFlightUrl', 'withKlookAff', 'appendAffiliateParams'].forEach(function (name) {
      var original = window[name];
      if (typeof original === 'function') window[name] = function () { return localize(original.apply(this, arguments)); };
    });
  });
  var originalOpen = window.open;
  window.open = function (url) { var args = Array.from(arguments); args[0] = localize(url); return originalOpen.apply(window, args); };
})();
