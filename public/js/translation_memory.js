/* Shared, pure translation memory used by the browser and static HTML generator. */
(function (root) {
  'use strict';
  var HAN = /[\u3400-\u9fff]/;
  var END = Symbol('translation');
  root.TabiTranslationMemory = {
    create: function (records, messages) {
      var dictionary = {}, templates = [], trie = {}, sourceIndex = new Map();
      records.forEach(function (entry) { sourceIndex.set(entry[1], entry[0]); });
      function normalize(value) { return String(value).replace(/\s+/g, ' ').trim(); }
      function escape(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
      function preserve(raw, value) { return (raw.match(/^\s*/) || [''])[0] + value + (raw.match(/\s*$/) || [''])[0]; }
  function build(messages) {
    dictionary = messages; templates = []; trie = {};
    records.forEach(function (record) {
      var source = record[1], translated = messages[record[0]];
      if (!translated) return;
      if (/ZXQVAR\d+QXZ/.test(source)) {
        var names = source.match(/ZXQVAR\d+QXZ/g);
        var pieces = source.split(/ZXQVAR\d+QXZ/).map(escape);
        templates.push({ pattern: new RegExp('^' + pieces.join('(.+?)') + '$'), names: names, translated: translated, length: source.length });
      } else if (source.length >= 2) {
        var node = trie;
        Array.from(source).forEach(function (ch) { node = node[ch] || (node[ch] = {}); });
        node[END] = translated;
      }
    });
    templates.sort(function (a, b) { return b.length - a.length; });
  }
  function translate(raw, depth) {
    if (!raw || (depth || 0) > 3) return raw;
    var source = normalize(raw), id = sourceIndex.get(source);
    if (id && dictionary[id]) return preserve(raw, dictionary[id]);
    if (!HAN.test(source)) return raw;
    for (var i = 0; i < templates.length; i++) {
      var match = templates[i].pattern.exec(source);
      if (match) {
        var values = {};
        templates[i].names.forEach(function (name, index) { values[name] = translate(match[index + 1], (depth || 0) + 1); });
        return preserve(raw, templates[i].translated.replace(/ZXQVAR\d+QXZ/g, function (name) { return values[name]; }));
      }
    }
    // Longest exact source fragments handle data labels joined to dynamic values.
    // Only the original string is scanned, so translated output is never interpreted as markup or rescanned.
    var chars = Array.from(source), result = '', changed = false;
    for (var start = 0; start < chars.length;) {
      var node = trie, best = null, end = start;
      for (var next = start; next < chars.length && node[chars[next]]; next++) {
        node = node[chars[next]];
        if (node[END]) { best = node[END]; end = next + 1; }
      }
      if (best) { result += best; start = end; changed = true; }
      else { result += chars[start]; start++; }
    }
    return changed ? preserve(raw, result) : raw;
  }
      build(messages);
      return { text: translate, has: function (source) { return !!dictionary[sourceIndex.get(normalize(source))]; } };
    }
  };
})(globalThis);
