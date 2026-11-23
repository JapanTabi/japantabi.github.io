// Fetch once; render cached weather again whenever the UI language changes.
(function () {
  var list = document.getElementById('heroWeatherList');
  if (!list) return;
  var cities = null;
  var failed = false;
  var uiReady = false;

  function render() {
    if (!uiReady) return;
    if (!cities) {
      var key = failed ? 'weather.error' : 'weather.loading';
      var status = document.createElement('span');
      status.dataset.i18n = key;
      status.textContent = TabiLang.t(key);
      list.replaceChildren(status);
    } else {
      list.replaceChildren.apply(list, cities.map(function (city) {
        var item = document.createElement('span');
        var key = 'city.' + city.key;
        var name = TabiLang.t(key);
        if (name === key) name = city.name;
        var temperatures = Array.from(new Set([city.temp_min, city.temp_max].filter(function (value) {
          return value && value !== '--';
        })));
        item.textContent = [name, city.icon, temperatures.join('–') || TabiLang.t('weather.noTemperature')].filter(Boolean).join(' ');
        // Keep JMA's original forecast wording alongside the localized rain chance.
        item.title = [city.weather, city.pop ? TabiLang.t('weather.rain', { pop: city.pop }) : ''].filter(Boolean).join('・');
        return item;
      }));
    }
    list.setAttribute('aria-busy', String(!cities && !failed));
  }

  TabiLang.onChange(render);
  TabiLang.ready.then(function () {
    uiReady = true;
    render();
  });
  fetch('data/weather_today.json', { cache: 'no-store', signal: AbortSignal.timeout(10000) })
    .then(function (response) {
      if (!response.ok) throw new Error('Weather request failed: ' + response.status);
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data.cities) || !data.cities.length || data.cities.some(function (city) { return !city || !city.name; })) {
        throw new Error('Invalid weather data');
      }
      cities = data.cities;
      render();
    })
    .catch(function (error) {
      failed = true;
      render();
      console.debug('Weather fetch skipped:', error);
    });
})();
