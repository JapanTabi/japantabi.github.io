/* Offline display translations. Source data, form values, user posts and URLs stay canonical. */
(function () {
  'use strict';
  if (!window.TabiLang) return;
  var base = new URL('../data/site_i18n/', document.currentScript.src);
  var records = [], sourceIndex = new Map(), dictionaries = new Map(), loading = new Map();
  var texts = new WeakMap(), attributes = new WeakMap(), protectedTexts = new WeakMap(), protectedAttributes = new WeakMap();
  var dictionary = {}, templates = [], trie = {}, language = 'zh-TW', epoch = 0;
  var observer, scheduled = false, ready = false, fallback = false;
  var SKIP = 'script,style,noscript,code,pre,[translate="no"],[data-i18n-skip],.feed-comment-text,.feed-user-line>span:first-child,[data-showcase-id],#favoritesDrawer,.lang-menu-opt,.btn-trans-choice,#langSwitch,#currentLangLabel';
  var HAN = /[\u3400-\u9fff]/;
  function normalize(value) { return String(value).replace(/\s+/g, ' ').trim(); }
  function escape(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function preserve(raw, value) { return (raw.match(/^\s*/) || [''])[0] + value + (raw.match(/\s*$/) || [''])[0]; }
  var memory;
  function build(messages) { dictionary = messages; memory = TabiTranslationMemory.create(records, messages); }
  function translate(raw) { return language === 'zh-TW' || !ready || !memory ? raw : memory.text(raw); }
  function allowed(element) {
    if (!element || element.closest(SKIP)) return false;
    // Failed or stale editorial entities retain their explicit source-language fallback.
    var card = element.closest('[data-spot-id]');
    if (card && card.dataset.i18nGuard === 'source') return false;
    return true;
  }
  function applyText(node) {
    if (!allowed(node.parentElement) || node.parentElement.closest('input,textarea,[contenteditable],[data-i18n]')) return;
    var current = node.nodeValue, state = texts.get(node);
    if (protectedTexts.get(node) === current) return;
    if (!state) {
      var original = node.parentElement.getAttribute('data-tabi-source-text');
      var previous = node.previousSibling;
      if (previous && previous.nodeType === Node.COMMENT_NODE && previous.nodeValue.indexOf('tabi:') === 0) {
        original = new TextDecoder().decode(Uint8Array.from(atob(previous.nodeValue.slice(5)), function (ch) { return ch.charCodeAt(0); }));
      }
      state = { source: original === null ? current : original, rendered: current };
    } else if (current !== state.rendered) state = { source: current, rendered: current };
    if (node.parentElement.tagName === 'OPTION' && !node.parentElement.hasAttribute('value')) node.parentElement.value = node.parentElement.value;
    var value = translate(state.source);
    if (current !== value) node.nodeValue = value;
    state.rendered = value; texts.set(node, state);
  }
  function applyAttributes(element) {
    if (!allowed(element)) return;
    var saved = attributes.get(element) || {};
    ['title', 'alt', 'placeholder', 'aria-label'].forEach(function (name) {
      if (element.hasAttribute('data-i18n-' + name) || !element.hasAttribute(name)) return;
      var current = element.getAttribute(name), state = saved[name];
      if ((protectedAttributes.get(element) || {})[name] === current) return;
      if (!state) state = { source: element.getAttribute('data-tabi-source-' + name) ?? current, rendered: current };
      else if (current !== state.rendered) state = { source: current, rendered: current };
      var value = translate(state.source);
      if (current !== value) element.setAttribute(name, value);
      state.rendered = value; saved[name] = state;
    });
    if (element.tagName === 'META' && /^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description)$/.test(element.name || element.getAttribute('property') || '')) {
      var content = element.content, meta = saved.content;
      if (!meta) meta = { source: element.getAttribute('data-tabi-source-content') ?? content, rendered: content };
      else if (content !== meta.rendered) meta = { source: content, rendered: content };
      var translated = translate(meta.source);
      if (translated !== content) element.content = translated;
      meta.rendered = translated; saved.content = meta;
    }
    attributes.set(element, saved);
  }
  function observe() { if (observer) observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'alt', 'placeholder', 'aria-label', 'content'] }); }
  function render() {
    if (!ready || !document.body) return;
    if (observer) observer.disconnect();
    var walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) applyText(walker.currentNode);
      else applyAttributes(walker.currentNode);
    }
    document.querySelectorAll('[data-spot-copy="source"]').forEach(function (card) {
      if (card.dataset.i18nGuard !== 'source' && language !== 'zh-TW' && dictionary[sourceIndex.get(normalize(card.dataset.sourceTitle || ''))]) {
        card.dataset.spotCopy = 'catalog'; card.dataset.contentLanguage = language;
      }
    });
    var notice = document.getElementById('spotTranslationNotice');
    if (notice && !document.querySelector('[data-spot-copy="source"]')) notice.hidden = true;
    document.querySelectorAll('a[href]').forEach(function (anchor) {
      var href = anchor.getAttribute('href');
      if (!href || href[0] === '#') return;
      var url; try { url = new URL(href, document.baseURI); } catch (_) { return; }
      if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
      url.pathname = url.pathname.replace(/\/(?:zh-TW|zh-CN|en|ja|ko|th|vi|hi|es)\/([^/]+\.html)$/, '/' + language + '/$1');
      url.searchParams.set('lang', language);
      if (anchor.href !== url.href) anchor.href = url.href;
    });
    document.documentElement.dataset.siteI18nState = fallback ? 'fallback' : 'ready';
    document.documentElement.dataset.siteI18nLanguage = language;
    var manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.href = new URL('manifests/' + language + '.json', base).href;
    var locale = document.querySelector('meta[property="og:locale"]');
    if (locale) locale.content = ({'zh-TW':'zh_TW','zh-CN':'zh_CN',en:'en_US',ja:'ja_JP',ko:'ko_KR',th:'th_TH',vi:'vi_VN',hi:'hi_IN',es:'es_ES'})[language];
    observe();
  }
  function schedule() { if (scheduled) return; scheduled = true; queueMicrotask(function () { scheduled = false; render(); }); }
  var indexReady = fetch(new URL('index.json', base)).then(function (r) { if (!r.ok) throw new Error('Translation index: ' + r.status); return r.json(); }).then(function (data) {
    records = data.entries;
    records.forEach(function (entry) { sourceIndex.set(entry[1], entry[0]); });
  });
  function load(lang) {
    var version = ++epoch; ready = false;
    document.documentElement.dataset.siteI18nState = 'loading';
    return indexReady.then(function () {
      if (lang === 'zh-TW') return {};
      if (dictionaries.has(lang)) return dictionaries.get(lang);
      if (!loading.has(lang)) loading.set(lang, fetch(new URL(lang + '.json', base)).then(function (r) { if (!r.ok) throw new Error('Site translations: ' + r.status); return r.json(); }).then(function (data) { dictionaries.set(lang, data.messages); return data.messages; }).finally(function () { loading.delete(lang); }));
      return loading.get(lang);
    }).then(function (messages) {
      if (version !== epoch) return false;
      language = lang; fallback = false; build(messages); ready = true; render();
      document.dispatchEvent(new CustomEvent('tabi:content-language', { detail: { language: lang } }));
      return true;
    }).catch(function (error) {
      if (version !== epoch) return false;
      language = 'zh-TW'; fallback = true; ready = true; build({}); render();
      document.documentElement.dataset.siteI18nState = 'fallback';
      console.warn('Site translations unavailable:', error);
      return false;
    });
  }
  // Dialog copy is translated at the display boundary; return values retain native semantics.
  ['alert', 'confirm', 'prompt'].forEach(function (name) {
    var original = window[name];
    window[name] = function (message) { var args = Array.from(arguments); args[0] = translate(String(message)); return original.apply(window, args); };
  });
  window.TabiI18n = { protectText: function (node) { protectedTexts.set(node, node.nodeValue); }, protectAttribute: function (element, name) { var values = protectedAttributes.get(element) || {}; values[name] = element.getAttribute(name); protectedAttributes.set(element, values); }, text: translate, render: schedule, has: function (source) { return !!dictionary[sourceIndex.get(normalize(source))]; }, ready: null };
  TabiLang.onChange(function (lang) { window.TabiI18n.ready = load(lang); });
  document.addEventListener('DOMContentLoaded', function () {
    observer = new MutationObserver(schedule); observe();
    window.TabiI18n.ready = load(TabiLang.get());
  });
})();
