// Localize display copy only. IDs, source snapshots and booking/navigation inputs stay canonical.
(function () {
  var entries = {};
  var sources = [];
  var attached = new WeakMap();
  var url = new URL('../data/spot_translations.json', document.currentScript.src);
  function value(object, path) { return path.split('.').reduce(function (current, key) { return current && current[key]; }, object); }
  function resolve(item) { return window.TabiSpotIdentity ? TabiSpotIdentity.resolve(item) : item; }
  function key(item) { return JSON.stringify([String(item.id), item.region || '', item.title || '']); }
  function identity(source, item) {
    return String(source.id) === String(item.id) && source.region === item.region && source.fields.title === item.title;
  }
  function matchSource(item) {
    var matches = Object.entries(entries).filter(function (pair) {
      var source = pair[1].source;
      return identity(source, item) && source.theme === item.theme && Object.keys(source.fields).every(function (path) {
        return value(item, path) === source.fields[path];
      });
    });
    return matches.length === 1 ? matches[0][1] : null;
  }
  function copy(entry) {
    var selected = entry && entry.translations[TabiLang.get()];
    return selected && Object.keys(entry.source.fields).every(function (path) {
      return typeof selected[path] === 'string' && selected[path].trim();
    }) ? selected : null;
  }
  function favorite(item) {
    var saved = item;
    item = resolve(item);
    var matches = Object.values(entries).filter(function (entry) {
      return identity(entry.source, item) && (!item.desc || item.desc === entry.source.fields.desc);
    });
    var entry = matches.length === 1 ? matches[0] : null;
    var translated = copy(entry);
    var result = Object.assign({}, saved);
    result.copyLanguage = 'zh-TW';
    result.copyTranslated = TabiLang.get() === 'zh-TW';
    if (translated) {
      result.title = translated.title;
      result.tag = translated.tag;
      result.desc = translated.desc;
      result.location = translated.locationDetail;
      result.tips = translated.bloomStatus;
      result.copyLanguage = TabiLang.get();
      result.copyTranslated = true;
    } else if (window.TabiI18n && !Object.values(entries).some(function (candidate) { return candidate.source.id === String(item.id); })) {
      var candidates = item.aliasResolved ? [item] : sources;
      var canonical = candidates.filter(function (source) { return String(source.id) === String(item.id) && source.title === item.title && source.region === item.region && (!item.desc || item.desc === source.desc); });
      if (canonical.length === 1 && TabiI18n.has(canonical[0].title)) {
        result.title = TabiI18n.text(canonical[0].title);
        result.tag = TabiI18n.text(canonical[0].tag || '');
        result.desc = TabiI18n.text(canonical[0].desc || '');
        result.location = TabiI18n.text(canonical[0].locationDetail || '');
        result.tips = TabiI18n.text(canonical[0].bloomStatus || '');
        result.copyLanguage = TabiLang.get();
        result.copyTranslated = true;
      }
    }
    return result;
  }
  function renderCard(card, item) {
    var entry = matchSource(item);
    var translated = copy(entry);
    card.dataset.i18nGuard = !entry && (!Object.keys(entries).length || Object.values(entries).some(function (candidate) { return candidate.source.id === String(item.id); })) ? 'source' : '';
    card.dataset.contentLanguage = translated ? TabiLang.get() : 'zh-TW';
    card.dataset.spotCopy = translated || TabiLang.get() === 'zh-TW' ? 'translated' : 'source';
    if (!translated || TabiLang.get() === 'zh-TW') return;
    var replacements = new Map(Object.entries(entry.source.fields).filter(function (pair) { return pair[1]; }).map(function (pair) {
      return [pair[1], translated[pair[0]]];
    }));
    var escape = function (text) { return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var pattern = new RegExp(Array.from(replacements.keys()).sort(function (a, b) { return b.length - a.length; }).map(escape).join('|'), 'g');
    function replace(text) { return text.replace(pattern, function (source) { return replacements.get(source); }); }
    var walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('[data-i18n]')) nodes.push(walker.currentNode);
    }
    nodes.forEach(function (node) { var original = node.textContent; node.textContent = replace(original); if (node.textContent !== original && window.TabiI18n) TabiI18n.protectText(node); });
    card.querySelectorAll('[alt], [title]').forEach(function (element) {
      ['alt', 'title'].forEach(function (attribute) {
        if (element.hasAttribute(attribute)) { var original = element.getAttribute(attribute); element.setAttribute(attribute, replace(original)); if (element.getAttribute(attribute) !== original && window.TabiI18n) TabiI18n.protectAttribute(element, attribute); }
      });
    });
  }
  window.TabiSpotI18n = {
    key: key,
    favorite: favorite,
    registerSources: function (records) { sources = records; },
    findSource: function (id, title, region) {
      var requested = resolve({id: id, title: title, region: region});
      id = requested.id; title = requested.title; region = requested.region;
      var matches = sources.filter(function (record) {
        return String(record.id) === String(id) && record.title === title && (!region || record.region === region);
      });
      return matches.length === 1 ? matches[0] : null;
    },
    attach: function (element, item) {
      attached.set(element, item);
      element.dataset.sourceTitle = item.title;
      element.dataset.sourceRegion = item.region || '';
      element.dataset.spotId = item.id;
    },
    render: function (container) {
      container.querySelectorAll('[data-spot-id]').forEach(function (card) {
        var item = attached.get(card);
        if (item) renderCard(card, item);
      });
      var notice = document.getElementById('spotTranslationNotice');
      if (notice) {
        notice.hidden = TabiLang.get() === 'zh-TW' || !container.querySelector('[data-spot-copy="source"]');
        var text = TabiLang.t('spots.sourceNotice');
        notice.textContent = text === 'spots.sourceNotice' ? '部分景點內容以原文顯示。' : text;
      }
    }
  };
  window.TabiSpotI18n.ready = fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then(function (response) { if (!response.ok) throw new Error('Spot translations: ' + response.status); return response.json(); })
    .then(function (data) {
      var candidate = data && data.entries;
      entries = Object.fromEntries(Object.entries(candidate && typeof candidate === 'object' ? candidate : {}).filter(function (pair) {
        var entry = pair[1];
        return entry && entry.source && typeof entry.source.id === 'string' && typeof entry.source.region === 'string' &&
          entry.source.fields && typeof entry.source.fields.title === 'string' &&
          Object.values(entry.source.fields).every(function (field) { return typeof field === 'string'; }) &&
          entry.translations && typeof entry.translations === 'object';
      }));
    })
    .catch(function (error) { console.debug('Spot translations unavailable:', error); });
})();
