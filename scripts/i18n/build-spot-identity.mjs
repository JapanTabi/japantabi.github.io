import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('public/data/spot_aliases.json'));const sources=JSON.parse(fs.readFileSync('public/data/spots.json'));
for(const entry of config.aliases){const row=sources.find(r=>r.id===entry.canonical.id);if(!row)throw new Error('Missing alias target '+entry.canonical.id);for(const key of Object.keys(entry.canonical))entry.canonical[key]=row[key];}
fs.writeFileSync('public/data/spot_aliases.json',JSON.stringify(config,null,2)+'\n');
const json=JSON.stringify(config.aliases);
const script=`/* Generated from spot_aliases.json. Resolve old identities without rewriting saved snapshots. */
(function () {
  var aliases = ${json};
  function resolve(item) {
    var matches = aliases.filter(function (entry) {
      return String(item.id) === String(entry.legacy.id) && item.title === entry.legacy.title && (!item.region || item.region === entry.legacy.region);
    });
    var targets = Array.from(new Set(matches.map(function (entry) { return entry.canonical.id; })));
    if (targets.length !== 1) return item;
    return Object.assign({}, item, matches[0].canonical, { aliasResolved: true });
  }
  window.TabiSpotIdentity = { resolve: resolve };
})();
`;
fs.writeFileSync('public/js/spot_identity.js',script);
console.log('Built legacy identity resolver for',config.aliases.length,'aliases.');
