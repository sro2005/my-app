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
  const mutationRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    const requestPath = new URL(request.url()).pathname;
    if (
      request.method() === 'POST' &&
      /\\/api\\/(?:auth\\/(?:register|login)|customers\\/(?:forgot-password|reset-password\\/))/.test(requestPath)
    ) {
      mutationRequests.push(request.method() + ' ' + requestPath);
    }
  });

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

    // Exercise catalogue filters and empty-state recovery using read-only product data.
    const categorySelect = page.locator('.evh-catalog-category-filter select');
    const firstCategory = await categorySelect.locator('option').nth(1).getAttribute('value');
    assert.ok(firstCategory, 'Expected the catalogue category filter to contain real categories.');
    await categorySelect.selectOption(firstCategory);
    await page.waitForFunction(category => {
      const cards = [...document.querySelectorAll('.evh-product-card')];
      return cards.length > 0 && cards.every(card =>
        card.querySelector('.evh-product-category')?.textContent.trim() === category
      );
    }, firstCategory, { timeout: 15000 });
    const categoryProductCount = await page.locator('.evh-product-card').count();
    assert.equal(categoryProductCount, 3,
      'Expected 3 demo products in category ' + firstCategory + ', got ' + categoryProductCount + '.');
    console.log('Catalog category filter passed: ' + firstCategory + ' (' + categoryProductCount + ' products).');

    await categorySelect.selectOption('all');
    await page.locator('input[type="search"]').fill('cafetera');
    await page.waitForFunction(() => {
      const cards = [...document.querySelectorAll('.evh-product-card')];
      return cards.length >= 3 && cards.every(card => /cafetera/i.test(card.innerText));
    }, null, { timeout: 15000 });
    const searchCount = await page.locator('.evh-product-card').count();
    assert.ok(searchCount >= 3 && searchCount < productCount,
      'Search should filter the catalogue to a smaller set of matches; got ' + searchCount + '.');
    console.log('Catalog text search passed: "cafetera" returned ' + searchCount + ' matching products.');

    await page.locator('input[type="search"]').fill('evh-product-that-does-not-exist-xyz');
    await page.getByRole('heading', { name: /no encontramos productos con esos filtros/i }).waitFor({ timeout: 15000 });
    assert.equal(await page.locator('.evh-product-card').count(), 0, 'An unmatched search should show the empty state.');
    await page.getByRole('button', { name: /limpiar filtros/i }).click();
    await page.waitForFunction(() => document.querySelectorAll('.evh-product-card').length >= 66, null, { timeout: 15000 });
    assert.equal(await page.locator('input[type="search"]').inputValue(), '', 'Clear filters should clear the search input.');
    assert.equal(await categorySelect.inputValue(), 'all', 'Clear filters should reset the selected category.');
    console.log('Catalog empty state and clear-filters recovery passed.');

    // Navigate directly to every customer-facing public route at a mobile viewport.
    // These checks render pages only: they do not submit forms, create users/orders, or send payments.
    const resetTokenFixture = 'a'.repeat(64);
    const publicRoutes = [
      { path: '/register', heading: 'Crea tu espacio', screenshot: 'register-mobile.png' },
      { path: '/login', heading: 'Qué bueno verte de nuevo', screenshot: 'login-mobile.png' },
      { path: '/recover-password', heading: 'Volvamos a conectarte', screenshot: 'recover-password-mobile.png' },
      { path: '/reset-password/' + resetTokenFixture, heading: 'Crea una nueva contraseña', screenshot: 'reset-password-mobile.png' },
      { path: '/pago-resultado?reference=EVH-TEST-BROWSER&status=APPROVED', heading: 'Resultado de la simulación de pago' },
      { path: '/catalogo', heading: 'Encuentra tu próximo favorito' },
      { path: '/about', heading: 'Sobre ElectroVibeHome' },
      { path: '/privacy', heading: 'Política de Privacidad' },
      { path: '/terms', heading: 'Términos de Servicio' }
    ];

    for (const route of publicRoutes) {
      const routeResponse = await page.goto(new URL(route.path, baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      assert.ok(routeResponse && routeResponse.ok(),
        'Public route returned a non-success status for ' + route.path + ': ' +
        (routeResponse ? routeResponse.status() : 'no response'));

      console.log('Public route response: ' + route.path + ' -> ' + page.url() + ' (HTTP ' + routeResponse.status() + ').');
      const heading = page.getByRole('heading', { name: new RegExp(route.heading, 'i') });
      try {
        await heading.first().waitFor({ timeout: 12000 });
      } catch (error) {
        const diagnostics = await page.evaluate(() => ({
          url: window.location.href,
          title: document.title,
          headings: [...document.querySelectorAll('h1, h2')].slice(0, 12).map(node => node.innerText.trim()),
          bodyText: (document.body.innerText || '').slice(0, 400)
        }));
        throw new Error('Expected heading "' + route.heading + '" was not rendered for ' + route.path +
          '. Browser diagnostics: ' + JSON.stringify(diagnostics) + '. Original error: ' + error.message);
      }
      await page.waitForTimeout(100);

      const routeLayout = await readLayout(page);
      assert.equal(routeLayout.viewportWidth, 390, 'Unexpected viewport on ' + route.path);
      assert.ok(routeLayout.documentWidth <= 391,
        'Public route overflows horizontally at 390px (' + route.path + '): ' + JSON.stringify(routeLayout));
      assert.ok(routeLayout.overflow.length === 0,
        'Visible elements overflow at 390px on ' + route.path + ': ' + JSON.stringify(routeLayout.overflow));

      console.log('Mobile public route passed: ' + route.path);
      if (route.screenshot) {
        await page.screenshot({ path: path.join(artifactsDir, route.screenshot), fullPage: true });
      }
    }

    // Check client-side form validation without creating accounts, requesting emails, or sending passwords.
    await page.goto(new URL('/register', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /crea tu espacio/i }).waitFor({ timeout: 15000 });
    const registrationName = page.locator('#register-first-name');
    assert.equal(await registrationName.evaluate(element => element.required), true,
      'Registration name should be required.');
    await page.getByRole('button', { name: /crear mi cuenta/i }).click();
    assert.equal(await registrationName.evaluate(element => element.validity.valueMissing), true,
      'Submitting an empty registration must be blocked by native validation.');

    await page.goto(new URL('/login', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /qué bueno verte de nuevo/i }).waitFor({ timeout: 15000 });
    const loginEmail = page.locator('#login-email');
    await loginEmail.fill('esto-no-es-un-correo');
    await page.getByRole('button', { name: /ingresar a mi cuenta/i }).click();
    assert.equal(await loginEmail.evaluate(element => element.validity.typeMismatch), true,
      'Login should block malformed email addresses before making an API request.');

    await page.goto(new URL('/recover-password', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /volvamos a conectarte/i }).waitFor({ timeout: 15000 });
    const recoveryEmail = page.locator('#recover-email');
    await page.getByRole('button', { name: /enviar enlace seguro/i }).click();
    assert.equal(await recoveryEmail.evaluate(element => element.validity.valueMissing), true,
      'Password recovery should require an email before making an API request.');

    await page.goto(new URL('/reset-password/' + resetTokenFixture, baseUrl).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.getByRole('heading', { name: /crea una nueva contraseña/i }).waitFor({ timeout: 15000 });
    const resetPassword = page.locator('#new-password');
    await resetPassword.fill('password-too-weak');
    await page.locator('#confirm-password').fill('password-too-weak');
    await page.getByRole('button', { name: /guardar contraseña/i }).click();
    assert.equal(await resetPassword.evaluate(element => element.validity.valid), false,
      'Weak reset passwords should fail the browser's strength constraint.');
    assert.deepEqual(mutationRequests, [],
      'Read-only browser acceptance must not send account, login, recovery, or reset POST requests: ' + mutationRequests.join('; '));
    console.log('Safe form validations passed: registration required fields, malformed login email, empty recovery email, and weak reset password; no mutating API requests were sent.');

    assert.deepEqual(pageErrors, [], 'JavaScript errors occurred in the preview: ' + pageErrors.join('; '));
    console.log('Responsive browser smoke passed: landing at 5 widths, 66-product mobile catalog, catalogue filters, 9 public routes, and safe form validation. Screenshots saved to ' + artifactsDir + '.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
