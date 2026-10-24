const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
if (!baseUrl) throw new Error('FRONTEND_URL must point to the published v2 preview.');

const artifactsDir = path.resolve('artifacts/frontend-browser');
fs.mkdirSync(artifactsDir, { recursive: true });

const viewportCases = [
  { width: 1440, height: 1000, heroColumns: 2, categoryColumns: 4, screenshot: 'landing-desktop.png' },
  { width: 1024, height: 768, heroColumns: 2, categoryColumns: 4 },
  { width: 768, height: 1024, heroColumns: 1, categoryColumns: 2 },
  { width: 390, height: 844, heroColumns: 1, categoryColumns: 2, screenshot: 'landing-mobile.png' },
  { width: 320, height: 740, heroColumns: 1, categoryColumns: 2 }
];

async function readLayout(page) {
  return page.evaluate(() => {
    const countGridColumns = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      return getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length;
    };

    const clippedByAncestor = (element, rect) => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== document.body) {
        const style = getComputedStyle(ancestor);
        if (['hidden', 'clip', 'auto', 'scroll'].includes(style.overflowX)) {
          const clip = ancestor.getBoundingClientRect();
          if (rect.left < clip.left - 1 || rect.right > clip.right + 1) return true;
        }
        ancestor = ancestor.parentElement;
      }
      return false;
    };

    const overflow = [...document.querySelectorAll('body *')]
      .filter(element => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width < 1 || rect.height < 1) return false;
        if (rect.left >= -1 && rect.right <= window.innerWidth + 1) return false;
        return !clippedByAncestor(element, rect);
      })
      .slice(0, 8)
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right)
        };
      });

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      heroColumns: countGridColumns('.evh-hero'),
      categoryColumns: countGridColumns('.evh-category-grid'),
      overflow
    };
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert.ok(response && response.ok(), 'Preview returned a non-success status: ' + (response ? response.status() : 'no response'));
    await page.getByRole('heading', { name: /tu hogar merece algo extraordinario/i }).waitFor({ timeout: 45000 });
    await page.getByRole('navigation', { name: /navegación principal/i }).waitFor();

    for (const viewport of viewportCases) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(100);
      const layout = await readLayout(page);

      assert.equal(layout.heroColumns, viewport.heroColumns,
        'Unexpected hero layout at ' + viewport.width + 'px: ' + JSON.stringify(layout));
      assert.equal(layout.categoryColumns, viewport.categoryColumns,
        'Unexpected category grid at ' + viewport.width + 'px: ' + JSON.stringify(layout));
      assert.ok(layout.documentWidth <= viewport.width + 1,
        'Document overflows horizontally at ' + viewport.width + 'px: ' + JSON.stringify(layout));
      assert.ok(layout.overflow.length === 0,
        'Visible elements overflow the viewport at ' + viewport.width + 'px: ' + JSON.stringify(layout.overflow));

      console.log('Responsive landing passed at ' + viewport.width + 'px: ' + layout.heroColumns + ' hero column(s), ' + layout.categoryColumns + ' category column(s).');
      if (viewport.screenshot) {
        await page.screenshot({ path: path.join(artifactsDir, viewport.screenshot), fullPage: true });
      }
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: /explorar productos/i }).click();
    await page.getByRole('heading', { name: /encuentra tu próximo favorito/i }).waitFor({ timeout: 45000 });
    await page.waitForFunction(() => document.querySelectorAll('.evh-product-card').length >= 66, null, { timeout: 45000 });
    const productCount = await page.locator('.evh-product-card').count();
    assert.ok(productCount >= 66, 'Expected at least 66 catalog cards, received ' + productCount + '.');

    const catalogLayout = await readLayout(page);
    assert.equal(catalogLayout.viewportWidth, 390);
    assert.ok(catalogLayout.documentWidth <= 391,
      'Mobile catalog overflows horizontally: ' + JSON.stringify(catalogLayout));
    assert.ok(catalogLayout.overflow.length === 0,
      'Visible catalog elements overflow at 390px: ' + JSON.stringify(catalogLayout.overflow));
    await page.screenshot({ path: path.join(artifactsDir, 'catalog-mobile.png'), fullPage: true });

    assert.deepEqual(pageErrors, [], 'JavaScript errors occurred in the preview: ' + pageErrors.join('; '));
    console.log('Responsive browser smoke passed: landing at 5 widths and mobile catalog with ' + productCount + ' product cards; screenshots saved to ' + artifactsDir + '.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
