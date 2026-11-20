import { test, expect } from '@playwright/test';

test('search, edit nested fields, save and restore a previous version', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#page-title')).toHaveText('首頁景點');
  await page.getByRole('searchbox').fill('目黑川');
  await expect(page.locator('.record-item')).toHaveCount(1);
  await page.locator('[data-field="title"]').fill('目黑川春日散策');
  await page.locator('[data-field="desc"]').fill('清晨沿河賞花，夜晚欣賞點燈。');
  await page.locator('[data-field="lat"]').fill('36.1');
  await page.locator('[data-field="lat"]').fill('');
  await page.locator('[data-field="lat"]').blur();
  await expect(page.locator('[data-field="lat"]')).toHaveValue('36.1');
  await page.locator('summary').filter({ hasText: '特色亮點' }).click();
  await page.locator('[data-field="內容"]').fill('夜櫻與河畔步道');
  await page.locator('#save').click();
  await expect(page.locator('#notice')).toContainText('已儲存到本機');
  await page.reload();
  await expect(page.locator('[data-field="title"]')).toHaveValue('目黑川春日散策');
  const saved = await (await page.request.get('/api/data/spots.json')).json();
  expect(saved.data[0].highlights).toEqual(['夜櫻與河畔步道']);
  expect(saved.data[0].hasNightLight).toBe(true);
  await page.locator('#history').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: '還原', exact: true }).first().click();
  await expect(page.locator('[data-field="title"]')).toHaveValue('目黑川櫻花');
  expect(errors).toEqual([]);
});

test('duplicate records, remove a draft and reject malformed JSON', async ({ page }) => {
  await page.goto('/');
  await page.locator('#duplicate').click();
  await page.locator('#new-key').fill('sakura_copy');
  await page.locator('#confirm-add').click();
  await expect(page.locator('#record-count')).toHaveText('3');
  await expect(page.locator('[data-field="id"]')).toHaveValue('sakura_copy');
  await page.locator('[data-field="title"]').fill('複製的景點');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#delete').click();
  await expect(page.locator('#record-count')).toHaveText('2');
  await page.locator('#json-tab').click();
  await page.locator('#json-editor').fill('{broken');
  await expect(page.locator('#save')).toBeDisabled();
  await expect(page.locator('#json-error')).not.toBeEmpty();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#reload').click();
  await expect(page.locator('#form-tab')).toHaveAttribute('aria-selected', 'true');
});

test('mobile navigation can edit a language entry', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#file-select').selectOption('i18n.json');
  await expect(page.locator('#page-title')).toHaveText('首頁多語文字');
  await page.getByRole('listitem').filter({ hasText: 'en' }).click();
  await page.locator('[data-field="brandTitle"]').fill('JAPAN TABI GUIDE');
  await page.locator('#save').click();
  await expect(page.locator('#notice')).toContainText('已儲存到本機');
  await page.reload();
  await page.getByRole('listitem').filter({ hasText: 'en' }).click();
  await expect(page.locator('[data-field="brandTitle"]')).toHaveValue('JAPAN TABI GUIDE');
});
