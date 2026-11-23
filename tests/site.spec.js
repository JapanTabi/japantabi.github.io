import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const uiMessages = JSON.parse(readFileSync('public/data/ui_translations.json', 'utf8'));
const showcaseMessages = JSON.parse(readFileSync('public/data/home_showcase_translations.json', 'utf8'));
const hotSpringSource = JSON.parse(readFileSync('public/data/hot_springs.json', 'utf8'));
const spotMessages = JSON.parse(readFileSync('public/data/spot_translations.json', 'utf8'));
const spotSources = JSON.parse(readFileSync('public/data/spots.json', 'utf8'));

test.beforeEach(async ({ page, baseURL }) => {
  // Exercise local behavior independently of third-party fonts, images and APIs.
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.origin === new URL(baseURL).origin || !url.protocol.startsWith('http')
      ? route.continue()
      : route.abort();
  });
});

for (const name of readdirSync('src').filter((name) => name.endsWith('.html'))) {
  test(`page loads: ${name}`, async ({ page, baseURL }) => {
    const errors = [];
    const missing = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (new URL(response.url()).origin === new URL(baseURL).origin && response.status() >= 400) {
        missing.push(`${response.status()} ${response.url()}`);
      }
    });
    const response = await page.goto(name, { waitUntil: 'networkidle' });
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(/.+/);
    if (name !== 'japan_sakura_app_design_preview.html') {
      await expect(page.locator('html')).toHaveAttribute('data-i18n-state', 'ready');
      const language = await page.locator('html').getAttribute('lang');
      const bindings = await page.locator('[data-i18n]').evaluateAll(elements => elements.map(el => ({
        key: el.dataset.i18n, text: el.textContent,
      })));
      expect(bindings.filter(binding => binding.text !== uiMessages[language][binding.key])).toEqual([]);
    }
    expect(missing).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`homepage data, language and saved favorites (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('./?lang=zh-TW');
    const cards = page.locator('#cards-container > [id^="spot-card-"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(page.locator('#heroWeatherList')).toContainText('東京');
    await expect(page.locator('#heroWeatherList')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#heroWeatherList > span')).toHaveCount(6);
    const weatherBounds = await page.locator('#heroWeatherStrip').boundingBox();
    expect(weatherBounds.x + weatherBounds.width).toBeLessThanOrEqual(viewport.width);

    const favorite = cards.first().locator('[data-fav-id]').first();
    const id = await favorite.getAttribute('data-fav-id');
    await favorite.click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1') || '[]')))
      .toEqual(expect.arrayContaining([expect.objectContaining({ id })]));

    await page.locator('#langDropdownTrigger').click();
    await page.locator('.lang-menu-opt[data-lang="en"]').click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('tabi_selected_lang'))).toBe('en');

    await page.reload();
    await expect(cards.first()).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1') || '[]')))
      .toEqual(expect.arrayContaining([expect.objectContaining({ id })]));
    expect(await page.evaluate(() => localStorage.getItem('tabi_selected_lang'))).toBe('en');
  });
}

test('homepage weather shows an error when data cannot be loaded', async ({ page }) => {
  await page.route('**/data/weather_today.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('./?lang=zh-TW');
  await expect(page.locator('#heroWeatherList')).toHaveText('天氣資料暫時無法載入，請稍後再試');
  await expect(page.locator('#heroWeatherList')).toHaveAttribute('aria-busy', 'false');
});

test('language persists between home, articles and article pills', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./?lang=zh-Hant');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-TW');
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="en"]').click();
  await expect(page.locator('#brandTitleZh')).toHaveText('Tabi Report');
  await page.goto('articles.html');
  await expect(page.locator('#langSwitch')).toHaveValue('en');
  await page.selectOption('#langSwitch', 'ja');
  await expect(page.locator('#title')).toHaveText('ディープ記事ライブラリ');
  await page.goto('./');
  await expect(page.locator('#currentLangLabel')).toHaveText('日本語');
  await page.goto('japan_special_edition_fuji.html');
  await page.locator('.btn-trans-choice[data-lang="en"]').click();
  await expect(page.locator('#currentLangLabel')).toHaveText('English');
  await expect(page.locator('#fuji_title')).not.toBeEmpty();
  await page.goto('articles.html');
  await expect(page.locator('#langSwitch')).toHaveValue('en');
  expect(errors).toEqual([]);
});

test('legacy preference migration and URL priority', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#cards-container > [id^="spot-card-"]').first()).toBeVisible();
  await page.evaluate(() => {
    localStorage.removeItem('tabi_selected_lang');
    localStorage.setItem('current_lang', 'ja-JP');
  });
  await page.goto('articles.html');
  await expect(page.locator('#langSwitch')).toHaveValue('ja');
  expect(await page.evaluate(() => localStorage.getItem('current_lang'))).toBeNull();
  await page.goto('articles.html?lang=zh_hans');
  await expect(page.locator('#langSwitch')).toHaveValue('zh-CN');
  await expect(page.locator('#grid .card')).toHaveCount(10);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
});

const sharedUiCases = [
  { language: 'zh-TW', flights: '查機票', privacy: '隱私權政策', weather: '東京', title: '深度文章庫' },
  { language: 'zh-CN', flights: '查机票', privacy: '隐私政策', weather: '东京', title: '深度文章库' },
  { language: 'en', flights: 'Flights', privacy: 'Privacy policy', weather: 'Tokyo', title: 'Deep-Dive Articles' },
  { language: 'ja', flights: '航空券', privacy: 'プライバシーポリシー', weather: '東京', title: 'ディープ記事ライブラリ' },
  { language: 'ko', flights: '항공권', privacy: '개인정보 처리방침', weather: '도쿄', title: '심층 여행 기사' },
  { language: 'th', flights: 'ตั๋วเครื่องบิน', privacy: 'นโยบายความเป็นส่วนตัว', weather: 'โตเกียว', title: 'คลังบทความเจาะลึก' },
  { language: 'vi', flights: 'Vé máy bay', privacy: 'Chính sách quyền riêng tư', weather: 'Tokyo', title: 'Thư viện bài viết chuyên sâu' },
  { language: 'hi', flights: 'उड़ानें', privacy: 'गोपनीयता नीति', weather: 'टोक्यो', title: 'विस्तृत यात्रा लेख' },
  { language: 'es', flights: 'Vuelos', privacy: 'Política de privacidad', weather: 'Tokio', title: 'Reportajes en profundidad' },
];

for (const example of sharedUiCases) {
  test(`shared UI, weather and article interface translate: ${example.language}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./?lang=zh-TW');
    await expect(page.locator('html')).toHaveAttribute('data-i18n-state', 'ready');
    await page.locator('#langDropdownTrigger').click();
    await page.locator(`.lang-menu-opt[data-lang="${example.language}"]`).click();
    await expect(page.locator('.app-header [data-i18n="nav.flights"]')).toHaveText(example.flights);
    await expect(page.locator('footer [data-i18n="privacy"]')).toHaveText(example.privacy);
    await expect(page.locator('#heroWeatherList')).toContainText(example.weather);
    for (const [id, entry] of Object.entries(spotMessages.entries)) {
      const card = page.locator(`#spot-card-${id}`);
      const copy = entry.translations[example.language];
      await expect(card).toHaveAttribute('data-content-language', example.language);
      await expect(card.locator('.card-title-header h3')).toHaveText(copy.title);
      await expect(card.locator('.card-clean-concise-desc')).toHaveText(copy.desc);
      await expect(card.locator('.spot-meta-row')).toContainText(copy.locationDetail);
      await expect(card.locator('.spot-meta-row')).toContainText(copy.species);
    }
    await expect(page.locator('.hero-slogan-zh')).toHaveText(uiMessages[example.language]['home.hero']);
    await expect(page.locator('#subContextPillsContainer [data-id="sakura_bloom"]')).toHaveText(uiMessages[example.language]['home.season.sakura']);
    await expect(page.locator('#featureFilterBar [data-i18n="home.feature.sakura.night"]')).toHaveText(uiMessages[example.language]['home.feature.sakura.night']);
    await expect(page.locator('#hotSpringCardsScroller [data-showcase-id]')).toHaveCount(10);
    await expect(page.locator('#festivalCardsScroller [data-showcase-id]')).toHaveCount(6);
    for (const [group, selector] of [['hot_springs', '#hotSpringCardsScroller'], ['festivals', '#festivalCardsScroller']]) {
      const cards = await page.locator(selector + ' [data-showcase-id]').evaluateAll(elements => elements.map(card => {
        const value = field => card.querySelector(`[data-field="${field}"]`)?.textContent;
        return { id: card.dataset.showcaseId, state: card.dataset.translationState, name: value('name'),
          highlights: value('highlights'), detail: value('detail'), meta: value('meta'), shots: value('shots'), transit: value('transit'),
          badge: card.querySelector('.showcase-badge').textContent };
      }));
      for (const card of cards) {
        const expected = showcaseMessages[example.language][group][card.id];
        expect(card.state).toBe('translated');
        expect(card.name).toBe(expected.name);
        expect(card.highlights).toBe(expected.highlights);
        expect(card.detail).toBe(group === 'hot_springs' ? expected.day_trip : expected.reserved_seats);
        if (group === 'hot_springs') expect(card.meta).toBe(expected.spring_quality);
        else {
          expect(card.badge).toBe(expected.badge + ' ｜ ' + expected.date_display);
          expect(card.shots).toBe(expected.shots);
          expect(card.transit).toBe('🚇 ' + expected.transit);
        }
      }
    }
    const header = await page.locator('.header-right').boundingBox();
    expect(header.x + header.width).toBeLessThanOrEqual(390);
    // The footer must be outside the hidden sports portal and its old broken button.
    await expect(page.locator('footer')).toBeVisible();
    expect(await page.locator('footer').evaluate(el => !!el.closest('.special-topic-modal, button'))).toBe(false);
    await page.reload();
    await expect(page.locator('.app-header [data-i18n="nav.flights"]')).toHaveText(example.flights);
    await page.goto('japan_entry_rules.html');
    await expect(page.locator('.app-header [data-i18n="nav.flights"]')).toHaveText(example.flights);
    await page.locator('.hub-item-fav').click();
    await expect(page.locator('#favoritesDrawer h3')).toHaveText(uiMessages[example.language]['favorites.title']);
    await expect(page.locator('.favorites-empty-state h4')).toHaveText(uiMessages[example.language]['favorites.empty']);
    await expect(page.locator('.btn-fav-copy-all')).toHaveText(uiMessages[example.language]['favorites.export']);
    await page.locator('#favoritesDrawer [data-i18n-aria-label="favorites.close"]').click();
    await page.goto('articles.html');
    await expect(page.locator('#title')).toHaveText(example.title);
    await expect(page).toHaveTitle(new RegExp(example.title));
    await expect(page.locator('#langSwitch')).toHaveValue(example.language);
  });
}

test('a late dictionary response uses the latest selected language', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/data/ui_translations.json', async route => {
    await gate;
    await route.continue();
  });
  await page.goto('articles.html?lang=en', { waitUntil: 'domcontentloaded' });
  try {
    await page.selectOption('#langSwitch', 'vi');
    await page.selectOption('#langSwitch', 'es');
  } finally {
    release();
  }
  await expect(page.locator('#title')).toHaveText('Reportajes en profundidad');
  await expect(page.locator('#langSwitch')).toHaveValue('es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('a failed dictionary request preserves readable source UI', async ({ page }) => {
  await page.route('**/data/ui_translations.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('articles.html?lang=en');
  await expect(page.locator('html')).toHaveAttribute('data-i18n-state', 'fallback');
  await expect(page.locator('#title')).toHaveText('深度文章庫');
  await expect(page.locator('#homeLink')).toHaveText('返回首頁');
});

test('weather error messages change language without another request', async ({ page }) => {
  let requests = 0;
  await page.route('**/data/weather_today.json', route => {
    requests++;
    return route.fulfill({ status: 503, body: 'Unavailable' });
  });
  await page.goto('./?lang=en');
  await expect(page.locator('#heroWeatherList')).toHaveText('Weather is unavailable. Please try again later.');
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="es"]').click();
  await expect(page.locator('#heroWeatherList')).toHaveText('No se puede cargar el tiempo. Inténtalo más tarde.');
  expect(requests).toBe(1);
});

test('home category, region and feature selections survive a language change', async ({ page }) => {
  await page.goto('./?lang=en');
  const cards = page.locator('#cards-container > [id^="spot-card-"]');
  await expect(cards.first()).toBeVisible();
  await page.locator('#subContextPillsContainer [data-id="fuji_wisteria"]').click();
  await page.locator('#featureFilterBar [data-i18n="home.feature.wisteria.night"]').click();
  await page.locator('#sakuraRegionBar [data-region="kanto"]').click();
  await expect(cards.first()).toBeVisible();
  const ids = await cards.evaluateAll(elements => elements.map(el => el.id));
  await expect(page.locator('#feedTitleText')).toHaveText('Live reports from Japan · Wisteria');
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="es"]').click();
  await expect(page.locator('#subContextPillsContainer .active')).toHaveAttribute('data-id', 'fuji_wisteria');
  await expect(page.locator('#sakuraRegionBar .active')).toHaveAttribute('data-region', 'kanto');
  await expect(page.locator('#featureFilterBar .active')).toHaveText('Glicinas iluminadas');
  await expect(page.locator('#feedTitleText')).toHaveText('Reportajes desde Japón · Glicinas');
  await expect(page.locator('#allSeasonRegionLabel')).toHaveText('Todos · Glicinas');
  expect(await cards.evaluateAll(elements => elements.map(el => el.id))).toEqual(ids);
  await page.locator('#subContextPillsContainer [data-id="momiji_view"]').click();
  await expect(page.locator('#featureFilterBar .pill-momiji-cafe')).toHaveText('Cafés con vistas otoñales');
  await expect(page.locator('#featureFilterBar .pill-momiji-cafe img')).toBeVisible();
  await page.locator('#featureFilterBar .pill-momiji-cafe').click();
  const bindings = await page.locator('#subContextPillsContainer [data-i18n], #featureFilterBar [data-i18n], #sakuraRegionBar [data-i18n]').evaluateAll(elements => elements.map(el => ({ key: el.dataset.i18n, text: el.textContent })));
  expect(bindings.filter(binding => binding.text !== uiMessages.es[binding.key])).toEqual([]);
});

test('all flower categories re-render translated labels and keep ginkgo filters hidden', async ({ page }) => {
  await page.goto('./?lang=vi');
  await expect(page.locator('#cards-container > [id^="spot-card-"]').first()).toBeVisible();
  for (const category of ['sakura_bloom', 'fuji_wisteria', 'nemophila_sea', 'hydrangea_season', 'momiji_view', 'ginkgo_gold', 'lavender_field', 'shibazakura_carpet', 'cosmos_autumn', 'ume_spring']) {
    await page.locator(`#subContextPillsContainer [data-id="${category}"]`).click();
    const bindings = await page.locator('#subContextPillsContainer [data-i18n], #featureFilterBar [data-i18n], #sakuraRegionBar [data-i18n]').evaluateAll(elements => elements.map(el => ({ key: el.dataset.i18n, text: el.textContent })));
    expect(bindings.filter(binding => binding.text !== uiMessages.vi[binding.key])).toEqual([]);
    await expect(page.locator('#spotsCountHint')).not.toContainText('{');
    if (category === 'ginkgo_gold') await expect(page.locator('#featureFilterBar')).toBeHidden();
  }
});

test('favorite toasts and clear confirmation use the current language', async ({ page }) => {
  await page.goto('./?lang=en');
  const cards = page.locator('#cards-container > [id^="spot-card-"]');
  await expect(cards.first()).toBeVisible();
  await cards.first().locator('[data-fav-id]').first().click();
  await expect(page.locator('#tabiToastContainer .tabi-toast').last()).toContainText('Saved:');
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="es"]').click();
  // The actual drawer button invokes the shared favorites controller.
  await page.locator('.hub-item-fav').click();
  page.once('dialog', async dialog => {
    expect(dialog.message()).toBe('¿Borrar todos los lugares guardados (1)?');
    await dialog.accept();
  });
  await page.locator('.btn-fav-clear').click();
  await expect(page.locator('#tabiToastContainer .tabi-toast').last()).toHaveText('🗑️Se han borrado todos los lugares guardados.');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')))).toEqual([]);
});

test('home data loading cannot overwrite a language chosen before dictionaries arrive', async ({ page }) => {
  let releaseMessages;
  let releaseSpots;
  const messagesGate = new Promise(resolve => { releaseMessages = resolve; });
  const spotsGate = new Promise(resolve => { releaseSpots = resolve; });
  await page.route('**/data/ui_translations.json', async route => { await messagesGate; await route.continue(); });
  await page.route('**/data/spots.json', async route => { await spotsGate; await route.continue(); });
  try {
    await page.goto('./?lang=en', { waitUntil: 'domcontentloaded' });
    await page.locator('#langDropdownTrigger').click();
    await page.locator('.lang-menu-opt[data-lang="es"]').click();
    releaseSpots();
    await expect(page.locator('#cards-container > [id^="spot-card-"]').first()).toBeVisible();
    await expect(page.locator('#currentLangLabel')).toHaveText('Español');
    releaseMessages();
    await expect(page.locator('.hero-slogan-zh')).toHaveText(uiMessages.es['home.hero']);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  } finally {
    releaseMessages();
    releaseSpots();
  }
});

test('showcase translations reuse source requests, links and scroll positions', async ({ page }) => {
  const counts = {};
  for (const file of ['hot_springs.json', 'festivals.json', 'home_showcase_translations.json']) {
    counts[file] = 0;
    await page.route(`**/data/${file}`, route => { counts[file]++; return route.continue(); });
  }
  await page.goto('./?lang=en');
  const spring = page.locator('#hotSpringCardsScroller [data-showcase-id="kusatsu"]');
  const festival = page.locator('#festivalCardsScroller [data-showcase-id="gion_festival"]');
  await expect(spring.locator('h3')).toHaveText('Kusatsu Onsen');
  await expect(festival.locator('[data-field="meta"]')).toHaveText('Program: Traditional festival; no fireworks');
  const source = hotSpringSource.find(row => row.id === 'kusatsu');
  const href = 'https://tw.trip.com/?Allianceid=9507030&SID=325761227&trip_sub1=' + encodeURIComponent(source.booking_keyword);
  await expect(spring.locator('a')).toHaveAttribute('href', href);
  const scroll = await page.locator('#hotSpringCardsScroller').evaluate(el => { el.scrollLeft = 500; return el.scrollLeft; });
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="es"]').click();
  await expect(spring.locator('[data-field="meta"]')).toHaveText(showcaseMessages.es.hot_springs.kusatsu.spring_quality);
  await expect(spring.locator('a')).toContainText('con cena y desayuno');
  await expect(spring.locator('a')).toHaveAttribute('href', href);
  expect(await page.locator('#hotSpringCardsScroller').evaluate(el => el.scrollLeft)).toBe(scroll);
  await expect(spring.locator('.showcase-original')).toHaveText('草津温泉');
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="ja"]').click();
  await expect(spring.locator('h3')).toHaveText('草津温泉');
  await expect(spring.locator('.showcase-original')).toBeHidden();
  expect(Object.values(counts)).toEqual([1, 1, 1]);
});

test('a failed showcase source leaves the other section usable', async ({ page }) => {
  await page.route('**/data/hot_springs.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('./?lang=es');
  await expect(page.locator('#hotSpringCardsScroller')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#hotSpringCardsScroller')).toHaveText('No se puede cargar. Inténtalo más tarde.');
  await expect(page.locator('#festivalCardsScroller [data-showcase-id]')).toHaveCount(6);
  await expect(page.locator('#festivalCardsScroller [data-showcase-id="nagaoka"] h3')).toHaveText(showcaseMessages.es.festivals.nagaoka.name);
});

test('a failed showcase dictionary preserves source cards and explains the fallback', async ({ page }) => {
  await page.route('**/data/home_showcase_translations.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('./?lang=en');
  await expect(page.locator('#hotSpringCardsScroller [data-translation-state="source"]')).toHaveCount(10);
  await expect(page.locator('#festivalCardsScroller [data-translation-state="source"]')).toHaveCount(6);
  await expect(page.locator('#hotSpringCardsScroller [data-showcase-id="kusatsu"] h3')).toHaveText('草津溫泉');
  await expect(page.locator('#hotSpringTranslationNotice')).toHaveText('Some content is shown in its original language.');
  await page.locator('#langDropdownTrigger').click();
  await page.locator('.lang-menu-opt[data-lang="es"]').click();
  await expect(page.locator('#festivalTranslationNotice')).toHaveText('Parte del contenido se muestra en su idioma original.');
});

test('an incomplete entity falls back without hiding other translations', async ({ page }) => {
  const messages = structuredClone(showcaseMessages);
  delete messages.es.hot_springs.kusatsu.highlights;
  await page.route('**/data/home_showcase_translations.json', route => route.fulfill({ json: messages }));
  await page.goto('./?lang=es');
  await expect(page.locator('#hotSpringCardsScroller [data-showcase-id="kusatsu"]')).toHaveAttribute('data-translation-state', 'source');
  await expect(page.locator('#hotSpringCardsScroller [data-showcase-id="kusatsu"] h3')).toHaveText('草津溫泉');
  await expect(page.locator('#hotSpringCardsScroller [data-translation-state="translated"]')).toHaveCount(9);
  await expect(page.locator('#hotSpringTranslationNotice')).toBeVisible();
  await expect(page.locator('#festivalTranslationNotice')).toBeHidden();
});

test('showcase copy is rendered as text and never as executable markup', async ({ page }) => {
  const messages = structuredClone(showcaseMessages);
  const injected = '<img src=x onerror="window.showcaseInjected=true">';
  messages.en.hot_springs.kusatsu.name = injected;
  messages.en.hot_springs.kusatsu.highlights = '<script>window.showcaseInjected=true</script>';
  await page.route('**/data/home_showcase_translations.json', route => route.fulfill({ json: messages }));
  await page.goto('./?lang=en');
  const card = page.locator('#hotSpringCardsScroller [data-showcase-id="kusatsu"]');
  await expect(card.locator('h3')).toHaveText(injected);
  await expect(card.locator('img')).toHaveCount(1);
  await expect(card.locator('img')).toHaveAttribute('alt', injected);
  expect(await page.evaluate(() => window.showcaseInjected)).toBeUndefined();
});

test('empty showcase data shows a translated empty state', async ({ page }) => {
  await page.route('**/data/festivals.json', route => route.fulfill({ json: [] }));
  await page.goto('./?lang=ja');
  await expect(page.locator('#festivalCardsScroller')).toHaveAttribute('data-state', 'empty');
  await expect(page.locator('#festivalCardsScroller')).toHaveText('現在、情報はありません。');
  await expect(page.locator('#hotSpringCardsScroller [data-showcase-id]')).toHaveCount(10);
});

test('saved places translate on display and export while stored source stays canonical', async ({ page }) => {
  await page.goto('./?lang=en');
  const id = 'hirosaki_night_sakura';
  const source = spotSources.find(row => row.id === id);
  const card = page.locator(`#spot-card-${id}`);
  await expect(card).toHaveAttribute('data-content-language', 'en');
  await card.locator('[data-fav-id]').first().click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')));
  expect(stored[0]).toEqual(expect.objectContaining({ id, title: source.title, region: source.region, desc: source.desc, location: source.locationDetail }));
  await page.locator('.hub-item-fav').click();
  await expect(page.locator('.fav-item-title')).toHaveText('Hirosaki Park (Ōyōen)');
  await page.locator('.btn-fav-expand-toggle').click();
  await expect(page.locator('.fav-detail-panel')).toBeVisible();
  const navigation = await page.locator('.fav-btn-nav').getAttribute('href');
  await page.evaluate(() => TabiLang.set('es'));
  await expect(page.locator('.fav-item-title')).toHaveText('Parque de Hirosaki');
  await expect(page.locator('.fav-detail-panel')).toBeVisible();
  await expect(page.locator('.fav-detail-meta').first()).toContainText(spotMessages.entries[id].translations.es.locationDetail);
  await expect(page.locator('.fav-btn-nav')).toHaveAttribute('href', navigation);
  await page.evaluate(() => {
    window.copiedTravelList = '';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedTravelList = text; } } });
  });
  await page.locator('.btn-fav-copy-all').click();
  await expect.poll(() => page.evaluate(() => window.copiedTravelList)).toContain('Mi lista de viaje a Japón (1)');
  const text = await page.evaluate(() => window.copiedTravelList);
  expect(text).toContain('Parque de Hirosaki');
  expect(text).toContain('Cómo llegar:');
  expect(text).not.toMatch(/\p{Script=Han}/u);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')))).toEqual(stored);
});

test('legacy favorites localize across pages without rewriting the saved snapshot', async ({ page }) => {
  const source = spotSources.find(row => row.id === 'takada_night_sakura');
  const legacy = { id: source.id, title: source.title, region: source.region, img: source.img, desc: source.desc, location: source.locationDetail, tips: source.bloomStatus, type: 'spot' };
  await page.addInitScript(item => localStorage.setItem('TABI_FAVORITES_V1', JSON.stringify([item])), legacy);
  await page.goto('japan_entry_rules.html?lang=en');
  await page.locator('.hub-item-fav').click();
  await expect(page.locator('.fav-item-title')).toHaveText('Takada Castle Site Park');
  await page.locator('.btn-fav-expand-toggle').click();
  await expect(page.locator('.fav-detail-desc')).toContainText('Matsudaira Tadateru');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')))).toEqual([legacy]);
});

test('two places sharing a legacy ID can be saved, expanded and removed independently', async ({ page }) => {
  const sources = spotSources.filter(row => ['maruyama_park_sakura', 'kyoto_maruyama_park_sakura'].includes(row.id));
  expect(sources).toHaveLength(2);
  await page.goto('./?lang=en');
  await expect(page.locator('#cards-container > [data-spot-id]').first()).toBeVisible();
  await page.evaluate(sources => sources.forEach(source => toggleFavorite(source.id, 'spot', source.title, source.img, source.region, source.tag)), sources);
  await page.locator('.hub-item-fav').click();
  await expect(page.locator('.fav-item-card')).toHaveCount(2);
  await page.locator('.btn-fav-expand-toggle').nth(0).click();
  await page.locator('.btn-fav-expand-toggle').nth(1).click();
  await expect(page.locator('.fav-detail-panel:not([hidden])')).toHaveCount(2);
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')));
  await page.locator('.fav-item-card').first().locator('.btn-fav-remove').click();
  await expect(page.locator('.fav-item-card')).toHaveCount(1);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')));
  expect(after).toEqual([before[1]]);
});

test('stored favorite text is never parsed as markup and unsafe links are omitted', async ({ page }) => {
  const title = '<img src=x onerror="window.favoriteInjected=true">';
  await page.addInitScript(title => localStorage.setItem('TABI_FAVORITES_V1', JSON.stringify([{ id: 'legacy-markup', title, region: 'kanto', img: './images/japan_tabi_logo.png', desc: '<script>window.favoriteInjected=true</script>', link: 'javascript:window.favoriteInjected=true', navUrl: 'javascript:window.favoriteInjected=true' }])), title);
  await page.goto('japan_entry_rules.html?lang=en');
  await page.locator('.hub-item-fav').click();
  await expect(page.locator('.fav-item-title')).toHaveText(title);
  await page.locator('.btn-fav-expand-toggle').click();
  await expect(page.locator('.fav-detail-desc')).toContainText('<script>window.favoriteInjected=true</script>');
  await expect(page.locator('.fav-item-card img')).toHaveCount(1);
  await expect(page.locator('.fav-btn-booking, .fav-btn-nav')).toHaveCount(0);
  expect(await page.evaluate(() => window.favoriteInjected)).toBeUndefined();
});

test('spot translations require the original region and content snapshot to match', async ({ page }) => {
  const records = structuredClone(spotSources);
  records.find(row => row.id === 'hirosaki_night_sakura').region = 'kansai';
  await page.route('**/data/spots.json', route => route.fulfill({ json: records }));
  await page.goto('./?lang=en');
  const card = page.locator('#spot-card-hirosaki_night_sakura');
  await expect(card).toHaveAttribute('data-spot-copy', 'source');
  await expect(card.locator('.card-title-header h3')).toHaveText('弘前公園（鷹揚園）');
  await expect(page.locator('#spotTranslationNotice')).toBeVisible();
});

test('spot dictionary failure preserves source cards and translated drawer controls', async ({ page }) => {
  await page.route('**/data/spot_translations.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('./?lang=es');
  await expect(page.locator('#spot-card-hirosaki_night_sakura .card-title-header h3')).toHaveText('弘前公園（鷹揚園）');
  await page.locator('.hub-item-fav').click();
  await expect(page.locator('#favoritesDrawer h3')).toHaveText('Mi lista de viaje a Japón');
  await expect(page.locator('.favorites-empty-state h4')).toHaveText('Tu lista de viaje está vacía');
});

test('legacy Kyoto ID and alternate snapshots retain independent saved identities', async ({page}) => {
 const aliases=JSON.parse(readFileSync('public/data/spot_aliases.json')).aliases;
 const kyoto=aliases.find(a=>a.canonical.id==='kyoto_maruyama_park_sakura');
 const ashikaga=aliases.find(a=>a.canonical.id==='ashikaga_fuji');
 const canonical=spotSources.find(s=>s.id==='ashikaga_fuji');
 const snapshots=[{...kyoto.legacy,type:'spot'},{...ashikaga.legacy,type:'spot'},{id:canonical.id,title:canonical.title,region:canonical.region,type:'spot'}];
 await page.addInitScript(items=>localStorage.setItem('TABI_FAVORITES_V1',JSON.stringify(items)),snapshots);
 await page.goto('japan_entry_rules.html?lang=en');await page.locator('.hub-item-fav').click();
 await expect(page.locator('.fav-item-card')).toHaveCount(3);
 expect(await page.evaluate(()=>TabiSpotIdentity.resolve(JSON.parse(localStorage.getItem('TABI_FAVORITES_V1'))[0]).id)).toBe('kyoto_maruyama_park_sakura');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')))).toEqual(snapshots);
 await page.locator('.btn-fav-expand-toggle').nth(1).click();
 await expect(page.locator('.fav-detail-panel:not([hidden])')).toHaveCount(1);
 await page.locator('.btn-fav-expand-toggle').nth(2).click();
 await expect(page.locator('.fav-detail-panel:not([hidden])')).toHaveCount(2);
 await page.locator('.fav-item-card').nth(2).locator('.btn-fav-remove').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('TABI_FAVORITES_V1')))).toEqual(snapshots.slice(0,2));
});

test('refund estimates distinguish tax rates, minimum amount and actual fees', async ({page}) => {
 await page.goto('./?lang=zh-TW');
 await page.evaluate(()=>openFxCalculator());
 await page.locator('#fxJpyInput').fill('5400');
 await page.evaluate(()=>calculateFx());
 await expect(page.locator('#fxTaxFreeJpy')).toContainText('未達未稅');
 await expect(page.locator('#fxCouponJpy')).toContainText('5,000');
 await expect(page.locator('#fxCouponJpy')).toContainText('未扣手續費');
 await page.locator('#fxJpyInput').fill('5500');await page.evaluate(()=>calculateFx());
 await expect(page.locator('#fxTaxFreeJpy')).toContainText('5,000');
 await page.locator('#fxJpyInput').fill('1000');await page.evaluate(()=>calculateFx());
 await expect(page.locator('#fxTaxFreeJpy')).toContainText('未達未稅');
 await expect(page.locator('.fx-tax-tip')).toContainText('2026-11-01');
 await expect(page.locator('.fx-tax-tip')).toContainText('90 日');
 await expect(page.locator('.fx-tax-tip')).not.toContainText('請勿拆封');
});
