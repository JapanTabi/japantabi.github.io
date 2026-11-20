import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';

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
    expect(missing).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`homepage data, language and saved favorites (${viewport.width}px)`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('./');
    const cards = page.locator('#cards-container > [id^="spot-card-"]');
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(1);

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
  await expect(page.locator('.empty')).toBeVisible();
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
});
