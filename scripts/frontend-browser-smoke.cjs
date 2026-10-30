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
        const style = getComputedStyle(element);
        const parent = element.parentElement;
        const parentRect = parent ? parent.getBoundingClientRect() : null;
        const parentStyle = parent ? getComputedStyle(parent) : null;
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          rectWidth: Math.round(rect.width),
          computedWidth: style.width,
          computedMinWidth: style.minWidth,
          computedMaxWidth: style.maxWidth,
          computedBoxSizing: style.boxSizing,
          computedFlex: style.flex,
          inlineStyle: element.getAttribute('style'),
          parentClassName: parent && typeof parent.className === 'string' ? parent.className : '',
          parentWidth: parentRect ? Math.round(parentRect.width) : null,
          parentComputedWidth: parentStyle ? parentStyle.width : null,
          parentFlexWrap: parentStyle ? parentStyle.flexWrap : null,
          parentMinWidth: parentStyle ? parentStyle.minWidth : null
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
  const assistantChatRequests = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    const requestPath = new URL(request.url()).pathname;
    if (
      request.method() === 'POST' &&
      /\/api\/(?:auth\/(?:register|login)|customers\/(?:forgot-password|reset-password\/))/.test(requestPath)
    ) {
      mutationRequests.push(request.method() + ' ' + requestPath);
    }
    if (request.method() === 'POST' && /\/api\/assistant\/chat$/.test(requestPath)) {
      assistantChatRequests.push(request.method() + ' ' + requestPath);
    }
  });

  try {
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert.ok(response && response.ok(), 'Preview returned a non-success status: ' + (response ? response.status() : 'no response'));
    await page.getByRole('heading', { name: /encuentra tecnología que haga más fácil tu día a día/i }).waitFor({ timeout: 45000 });
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

    await page.setViewportSize({ width: 1440, height: 1000 });
    const catalogDesktopLayout = await readLayout(page);
    assert.ok(catalogDesktopLayout.documentWidth <= 1441,
      'Desktop catalog overflows horizontally: ' + JSON.stringify(catalogDesktopLayout));
    assert.ok(catalogDesktopLayout.overflow.length === 0,
      'Visible desktop catalog elements overflow: ' + JSON.stringify(catalogDesktopLayout.overflow));
    const categoryLabelMetrics = await page.locator('.evh-catalog-category-filter select').evaluate(select => {
      const style = getComputedStyle(select);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = style.font;
      const text = select.selectedOptions[0]?.textContent || '';
      const availableWidth = select.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
      return { text, textWidth: context.measureText(text).width, availableWidth, selectWidth: select.clientWidth };
    });
    assert.ok(categoryLabelMetrics.textWidth <= categoryLabelMetrics.availableWidth,
      'Desktop category label is clipped: ' + JSON.stringify(categoryLabelMetrics));
    await page.screenshot({ path: path.join(artifactsDir, 'catalog-desktop.png'), fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
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
      { path: '/register', heading: 'Crea tu cuenta', screenshot: 'register-mobile.png' },
      { path: '/login', heading: 'Qué bueno verte de nuevo', screenshot: 'login-mobile.png' },
      { path: '/recover-password', heading: 'Volvamos a conectarte', screenshot: 'recover-password-mobile.png' },
      { path: '/reset-password/' + resetTokenFixture, heading: 'Crea una nueva contraseña', screenshot: 'reset-password-mobile.png' },
      { path: '/catalogo', heading: 'Encuentra tu próximo favorito' },
      { path: '/about', heading: 'Sobre Nosotros' },
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
      if (route.path === '/catalogo') {
        await page.waitForFunction(() => {
          const state = document.querySelector('.evh-assistant-status')?.getAttribute('aria-label') || '';
          return ['Orientación local disponible', 'Guía no disponible'].includes(state);
        }, null, { timeout: 20000 });
        const assistantState = await page.locator('.evh-assistant-status').getAttribute('aria-label');
        assert.ok(
          ['Orientación local disponible', 'Guía no disponible'].includes(assistantState),
          'Unexpected ElectroVibe Guide state: ' + assistantState
        );
        console.log('ElectroVibe Guide local status: ' + assistantState + '. No paid API is configured.');
        if (assistantState === 'Orientación local disponible') {
          await page.getByRole('button', { name: /cocina pequeña/i }).click();
          const assistantInput = page.locator('#evh-assistant-input');
          assert.equal(
            await assistantInput.inputValue(),
            'Busco algo práctico para una cocina pequeña.',
            'The local guide suggestion should populate the prompt field.'
          );
          await page.getByRole('button', { name: /enviar pregunta/i }).click();
          const localReply = page.locator('.evh-assistant-message.is-assistant').filter({
            hasText: /Según lo que describes/i
          }).last();
          await localReply.waitFor({ timeout: 15000 });
          assert.match(await localReply.innerText(), /precio de referencia/i,
            'The local guide should provide a grounded catalogue suggestion with illustrative price context.');
          assert.deepEqual(assistantChatRequests, [],
            'Local guide mode must not send a chat request to the backend.');
          console.log('Local ElectroVibe Guide interaction passed without any external AI request.');
        }
      }
      if (route.screenshot) {
        await page.screenshot({ path: path.join(artifactsDir, route.screenshot), fullPage: true });
      }
    }

    // Check client-side form validation without creating accounts, requesting emails, or sending passwords.
    await page.goto(new URL('/register', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /crea tu cuenta/i }).waitFor({ timeout: 15000 });
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
      "Weak reset passwords should fail the browser's strength constraint.");
    assert.deepEqual(mutationRequests, [],
      'Read-only browser acceptance must not send account, login, recovery, or reset POST requests: ' + mutationRequests.join('; '));
    console.log('Safe form validations passed: registration required fields, malformed login email, empty recovery email, and weak reset password; no mutating API requests were sent.');


    // Visual and interactive checks for authenticated customer/admin modules.
    // All API calls in this section are intercepted and answered with local fixtures.
    // No account, product, order, password, or payment change is sent to a live backend.
    let activeVisualRole = 'admin';
    const mockApiCalls = [];
    const mockApiWrites = [];
    const fixtureProducts = [
      { _id: 'product-coffee-001', name: 'Cafetera Boreal 12 tazas', category: 'Cafeteras', description: 'Cafetera programable con jarra de vidrio, filtro lavable y apagado automático.', price: 149900.5, quantity: 5, imageUrl: '', demo: false },
      { _id: 'product-fridge-001', name: 'Refrigerador Nórdico 300 L', category: 'Refrigeración', description: 'Refrigerador de 300 litros con control de temperatura y bandejas ajustables.', price: 1299900, quantity: 7, imageUrl: '', demo: false },
      { _id: 'product-vacuum-001', name: 'Aspiradora NovaClean 1800', category: 'Aspiradoras', description: 'Aspiradora doméstica con filtro lavable y accesorios para superficies múltiples.', price: 379900, quantity: 3, imageUrl: '', demo: false }
    ];
    const customerUser = {
      _id: 'customer-browser-001', role: 'user', firstName: 'Marina', lastName: 'Rojas',
      email: 'marina.browser@example.test', phone: '+57 300 555 0123',
      identificationNumber: '1020304050', birthDate: '1994-05-12',
      lastActivityDate: new Date().toISOString(), preferences: ['Cafeteras']
    };
    const inactiveCustomer = {
      _id: 'customer-browser-002', role: 'user', firstName: 'Daniel', lastName: 'Pardo',
      email: 'daniel.browser@example.test', phone: '+57 300 555 0199',
      identificationNumber: '9080706050', birthDate: '1989-02-11',
      lastActivityDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      preferences: [], orders: []
    };
    const fixtureOrder = {
      _id: '507f1f77bcf86cd799439099', firstName: 'Marina', lastName: 'Rojas',
      email: customerUser.email, address: 'Calle 10 # 20-30, Bogotá', phone: customerUser.phone,
      paymentMethod: 'Pago pendiente de coordinación', paymentStatus: 'PENDING', paymentConfirmed: false,
      orderDate: new Date().toISOString(), deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: 299801, status: 'Pendiente', packed: false, delivered: false,
      products: [{ productId: { _id: fixtureProducts[0]._id, name: fixtureProducts[0].name, category: fixtureProducts[0].category }, quantity: 2 }]
    };
    let fixtureOrders = [fixtureOrder];
    let fixtureCustomers = [
      { ...customerUser, orders: [fixtureOrder] },
      inactiveCustomer
    ];
    const adminUser = {
      _id: 'admin-browser-001', role: 'admin', firstName: 'Equipo',
      lastName: 'Administración', email: 'admin.browser@example.test', preferences: []
    };
    const corsHeaders = {
      'access-control-allow-origin': new URL(baseUrl).origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type'
    };

    await page.route('**/api/**', async route => {
      const request = route.request();
      const method = request.method();
      const requestUrl = new URL(request.url());
      const requestPath = requestUrl.pathname;
      mockApiCalls.push(method + ' ' + requestPath);
      if (method !== 'GET' && method !== 'OPTIONS') mockApiWrites.push(method + ' ' + requestPath);
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders, body: '' });
        return;
      }
      const respond = (payload, status = 200) => route.fulfill({
        status,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify(payload)
      });
      if (method === 'GET' && /\/api\/orders\/(?:all|my-orders)$/.test(requestPath)) {
        return respond(fixtureOrders);
      }
      if (method === 'GET' && /\/api\/customers\/all$/.test(requestPath)) {
        return respond(fixtureCustomers);
      }
      if (method === 'GET' && /\/api\/customers\/profile$/.test(requestPath)) {
        return respond(customerUser);
      }
      if (method === 'GET' && /\/api\/products\/preferences$/.test(requestPath)) {
        return respond(fixtureProducts.filter(product => customerUser.preferences.includes(product.category)));
      }
      if (method === 'GET' && /\/api\/products$/.test(requestPath)) {
        return respond(fixtureProducts);
      }
      if (method === 'PUT' && /\/api\/orders\/[^/]+\/status$/.test(requestPath)) {
        const fields = request.postDataJSON() || {};
        const current = fixtureOrders.find(order => requestPath.includes(order._id)) || fixtureOrder;
        const updated = {
          ...current,
          ...fields,
          status: fields.delivered ? 'Entregado' : fields.packed ? 'Enviado' : current.status
        };
        fixtureOrders = fixtureOrders.map(order => order._id === updated._id ? updated : order);
        return respond({ message: 'Estado del pedido actualizado.', order: updated });
      }
      if (method === 'PUT' && /\/api\/products\/[^/]+$/.test(requestPath)) {
        const id = requestPath.split('/').pop();
        const updated = { ...fixtureProducts.find(product => product._id === id), ...(request.postDataJSON() || {}) };
        return respond({ message: 'Producto actualizado.', product: updated });
      }
      if (method === 'PUT' && /\/api\/customers\/[^/]+$/.test(requestPath)) {
        return respond({ ...customerUser, ...(request.postDataJSON() || {}) });
      }
      return respond({ message: 'No fixture configured for ' + method + ' ' + requestPath }, 404);
    });

    const setVisualSession = async user => {
      await page.evaluate(storedUser => {
        localStorage.setItem('authToken', 'browser-visual-only-token');
        localStorage.setItem('userData', JSON.stringify(storedUser));
        localStorage.setItem('userId', String(storedUser._id));
      }, user);
    };
    const assertNoOverflow = async label => {
      const layout = await readLayout(page);
      assert.ok(layout.documentWidth <= layout.viewportWidth + 1,
        label + ' has horizontal document overflow: ' + JSON.stringify(layout));
      assert.ok(layout.overflow.length === 0,
        label + ' has visible elements overflowing the viewport: ' + JSON.stringify(layout.overflow));
      return layout;
    };
    const captureAuthenticatedRoute = async (routePath, headingPattern, basename, waitForSelector) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const routeResponse = await page.goto(new URL(routePath, baseUrl).toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      assert.ok(routeResponse && routeResponse.ok(),
        'Authenticated route returned a non-success status for ' + routePath);
      await page.getByRole('heading', { name: headingPattern }).first().waitFor({ timeout: 20000 });
      if (waitForSelector) await page.locator(waitForSelector).first().waitFor({ timeout: 20000 });
      await page.waitForTimeout(100);
      const desktopLayout = await assertNoOverflow(routePath + ' at desktop');
      await page.screenshot({ path: path.join(artifactsDir, basename + '-desktop.png'), fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(100);
      const mobileLayout = await assertNoOverflow(routePath + ' at mobile');
      if (await page.locator('.evh-admin-table-scroll').count()) {
        const tableMetrics = await page.locator('.evh-admin-table-scroll').evaluate(element => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth
        }));
        assert.ok(tableMetrics.scrollWidth <= tableMetrics.clientWidth + 1,
          'Admin recent-orders table needs horizontal scrolling at mobile width: ' + JSON.stringify(tableMetrics));
      }
      await page.screenshot({ path: path.join(artifactsDir, basename + '-mobile.png'), fullPage: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      console.log('Authenticated visual pass: ' + routePath + ' at desktop (' + desktopLayout.documentWidth + 'px document) and mobile (' + mobileLayout.documentWidth + 'px document).');
    };

    activeVisualRole = 'admin';
    await setVisualSession(adminUser);
    await captureAuthenticatedRoute('/home-page', /Tu tienda, bajo control/i, 'admin-dashboard', '.evh-admin-stat');
    assert.equal(await page.locator('.evh-admin-session-role').innerText(), 'Administrador');
    assert.equal(await page.locator('.evh-admin-session-copy strong').innerText(), adminUser.email);
    await page.getByRole('button', { name: 'Actualizar Resumen' }).click();
    await page.locator('.evh-admin-stat').first().waitFor({ timeout: 15000 });
    assert.ok(mockApiCalls.filter(call => /\/api\/orders\/all$/.test(call)).length >= 2,
      'The admin dashboard reload button should refresh the operational summary.');

    await captureAuthenticatedRoute('/admin-inventario', /Gestiona cada producto/i, 'admin-inventory', '.evh-admin-product');

    const desktopInventoryToolbar = await page.locator('.evh-admin-inventory-tools').evaluate(container => {
      const rect = selector => {
        const { top, bottom, width, height } = container.querySelector(selector).getBoundingClientRect();
        return { top, bottom, width, height };
      };
      return { label: rect('label'), search: rect('input'), refresh: rect('button') };
    });
    assert.ok(desktopInventoryToolbar.label.bottom <= desktopInventoryToolbar.search.top + 1,
      'Inventory search label should remain above its input on desktop.');
    assert.ok(Math.abs(desktopInventoryToolbar.search.top - desktopInventoryToolbar.refresh.top) <= 1,
      'Inventory search and refresh controls should align vertically on desktop.');
    assert.ok(Math.abs(desktopInventoryToolbar.search.height - desktopInventoryToolbar.refresh.height) <= 1,
      'Inventory search and refresh controls should have matching heights on desktop.');

    const fractionalCafeteraPrice = await page.locator('.evh-admin-product')
      .filter({ hasText: 'Cafetera Boreal 12 tazas' })
      .locator('.evh-admin-product-price').innerText();
    assert.match(fractionalCafeteraPrice, /149\.900,50/,
      'Inventory should preserve the two decimal places stored for a product price.');

    const inventoryPriceAndStock = await page.locator('.evh-admin-product-meta').first().evaluate(container => {
      const price = container.querySelector('.evh-admin-product-price').getBoundingClientRect();
      const stock = container.querySelector('.evh-admin-product-stock').getBoundingClientRect();
      return { priceTop: price.top, stockTop: stock.top };
    });
    assert.ok(Math.abs(inventoryPriceAndStock.priceTop - inventoryPriceAndStock.stockTop) <= 1,
      'Inventory price and stock should share the same visual row on desktop.');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    await assertNoOverflow('Inventory toolbar at mobile');
    const mobileInventoryToolbar = await page.locator('.evh-admin-inventory-tools').evaluate(container => {
      const rect = selector => {
        const { top, bottom, left, width } = container.querySelector(selector).getBoundingClientRect();
        return { top, bottom, left, width };
      };
      return { label: rect('label'), search: rect('input'), refresh: rect('button') };
    });
    assert.ok(mobileInventoryToolbar.label.bottom <= mobileInventoryToolbar.search.top + 1,
      'Inventory search label should remain above its input on mobile.');
    assert.ok(mobileInventoryToolbar.search.bottom <= mobileInventoryToolbar.refresh.top + 1,
      'Inventory refresh action should stack below the search input on mobile.');
    assert.ok(Math.abs(mobileInventoryToolbar.search.width - mobileInventoryToolbar.refresh.width) <= 1,
      'Inventory search and refresh controls should share the same width on mobile.');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(100);
    await page.locator('#inventory-search').fill('Refrigerador');
    assert.equal(await page.locator('.evh-admin-product').count(), 1, 'Inventory search should filter product cards.');
    await page.locator('#inventory-search').fill('');
    await page.getByRole('button', { name: 'Editar' }).first().click();
    const desktopEditorColumns = await page.locator('.evh-admin-editor-inline form').evaluate(form =>
      getComputedStyle(form).gridTemplateColumns.trim().split(' ').filter(Boolean).length
    );
    assert.equal(desktopEditorColumns, 2,
      'Inventory editor should use two balanced columns on desktop.');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    await assertNoOverflow('Inventory editor at mobile');
    const mobileEditorColumns = await page.locator('.evh-admin-editor-inline form').evaluate(form =>
      getComputedStyle(form).gridTemplateColumns.trim().split(' ').filter(Boolean).length
    );
    assert.equal(mobileEditorColumns, 1,
      'Inventory editor should collapse to one column on mobile.');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForTimeout(100);
    await page.getByLabel('Existencias', { exact: true }).fill('4');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    await page.getByRole('status').filter({ hasText: /Producto actualizado|cambios ya están guardados/i }).waitFor({ timeout: 15000 });
    assert.ok(mockApiWrites.some(call => /^PUT \/api\/products\//.test(call)),
      'Editing inventory should issue only a mocked product update.');
    await page.getByRole('button', { name: 'Eliminar' }).first().click();
    await page.getByRole('alertdialog', { name: 'Confirmar Eliminación' }).waitFor();
    await page.getByRole('button', { name: 'Conservar Producto' }).click();
    assert.ok(!mockApiWrites.some(call => /^DELETE \/api\/products\//.test(call)),
      'Cancelling product deletion must not issue a delete request.');

    await captureAuthenticatedRoute('/producto-form', /Agregar un producto/i, 'admin-add-product');
    await page.getByRole('button', { name: 'Agregar al inventario' }).click();
    assert.equal(await page.locator('#product-name').evaluate(element => element.validity.valueMissing), true,
      'Empty product form should be blocked by native browser validation.');
    assert.ok(!mockApiWrites.some(call => /^POST \/api\/products\/agregar$/.test(call)),
      'An empty product form must not call the create-product API.');

    await captureAuthenticatedRoute('/listado-clientes', /Gestión de Clientes/i, 'admin-customers', '.cliente-item');
    await page.locator('input[aria-label*="Buscar clientes"]').fill('Marina');
    assert.ok(await page.locator('.clientes-list .cliente-item').count() >= 1,
      'Customer search should return matching records.');
    await page.getByRole('button', { name: 'Limpiar Filtros' }).click();
    await page.getByRole('button', { name: 'Inactivos' }).click();
    assert.equal(await page.locator('.clientes-list .cliente-item').count(), 1,
      'The Inactivos filter should show only customers with old activity.');
    assert.ok(await page.getByText('Daniel Pardo').count() >= 1,
      'The inactive customer should be visible after filtering.');

    await captureAuthenticatedRoute('/listado-pedidos', /Gestión de Pedidos/i, 'admin-orders', '.pedido-item');
    await page.getByRole('button', { name: /Marcar preparado y enviado/i }).click();
    await page.getByRole('button', { name: /Marcar como entregado/i }).waitFor({ timeout: 15000 });
    assert.ok(mockApiWrites.some(call => /^PUT \/api\/orders\/.+\/status$/.test(call)),
      'Admin delivery workflow should use the mocked order-status route.');

    await captureAuthenticatedRoute('/seguridad', /Cambia tu contraseña/i, 'admin-security');
    await page.getByLabel('Contraseña actual').fill('CurrentPassword123!');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('NewSecurePass123!');
    await page.getByLabel('Confirma la nueva contraseña').fill('OtherSecurePass123!');
    await page.getByRole('button', { name: 'Actualizar Contraseña' }).click();
    await page.getByRole('alert').filter({ hasText: /confirmación no coincide/i }).waitFor();
    assert.ok(!mockApiWrites.some(call => /^PUT \/api\/auth\/change-password$/.test(call)),
      'Mismatched password confirmation must not send a change-password request.');

    activeVisualRole = 'user';
    await setVisualSession(customerUser);
    await captureAuthenticatedRoute('/home-page', /Hola, Marina/i, 'customer-home', '.evh-customer-hero');
    await captureAuthenticatedRoute('/catalogo', /Encuentra tu próximo favorito/i, 'customer-catalog', '.evh-product-card');
    assert.ok(await page.locator('.evh-product-order-link').count() >= 1,
      'Authenticated customers should see links to add available products to an order.');

    await captureAuthenticatedRoute('/pedido-form', /Tu compra, a tu manera/i, 'customer-order-form', '#checkout-product');
    await page.locator('#checkout-product').click();
    await page.getByRole('option', { name: /Cafetera Boreal 12 tazas/i }).click();
    await page.getByRole('button', { name: 'Agregar al Pedido' }).click();
    await page.getByText('Cafetera Boreal 12 tazas').first().waitFor();
    await page.getByRole('heading', { name: 'ElectroVibe Pay' }).waitFor();
    assert.equal(await page.getByRole('radio', { name: /Tarjeta/i }).count(), 0,
      'ElectroVibe Pay should not ask the customer to choose unconnected banking methods.');
    await page.getByLabel('Dirección de entrega').fill('Calle 10 # 20-30, Bogotá');
    const requestedDeliveryDate = new Date();
    requestedDeliveryDate.setDate(requestedDeliveryDate.getDate() + 7);
    const requestedDeliveryDateValue = [
      requestedDeliveryDate.getFullYear(),
      String(requestedDeliveryDate.getMonth() + 1).padStart(2, '0'),
      String(requestedDeliveryDate.getDate()).padStart(2, '0')
    ].join('-');
    await page.locator('#deliveryDate').fill(requestedDeliveryDateValue);
    await page.getByRole('button', { name: 'Continuar con ElectroVibe Pay' }).click();
    await page.getByRole('dialog', { name: /Confirma tu pedido/i }).waitFor({ timeout: 15000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow('Order confirmation dialog at mobile');
    await page.screenshot({ path: path.join(artifactsDir, 'customer-order-confirmation-mobile.png'), fullPage: true });
    await page.getByRole('button', { name: /Volver a editar/i }).click();
    assert.ok(!mockApiWrites.some(call => /^POST \/api\/orders\/realizar$/.test(call)),
      'Opening and cancelling order confirmation must not create an order.');

    await captureAuthenticatedRoute('/listado-pedidos', /Mis pedidos/i, 'customer-orders', '.pedido-item');
    assert.equal(await page.getByRole('button', { name: /Marcar preparado y enviado/i }).count(), 0,
      'Customer views must not expose admin shipping actions.');
    await captureAuthenticatedRoute('/perfil-cliente', /Mi Perfil/i, 'customer-profile', '.evh-profile-card');
    await page.getByRole('button', { name: 'Editar Perfil' }).click();
    await page.getByRole('heading', { name: 'Editar tus datos' }).waitFor();
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await captureAuthenticatedRoute('/seguridad', /Cambia tu contraseña/i, 'customer-security');
    await page.getByLabel('Contraseña actual').fill('CurrentPassword123!');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('NewSecurePass123!');
    await page.getByLabel('Confirma la nueva contraseña').fill('OtherSecurePass123!');
    await page.getByRole('button', { name: 'Actualizar Contraseña' }).click();
    await page.getByRole('alert').filter({ hasText: /confirmación no coincide/i }).waitFor();

    await page.goto(new URL('/admin-inventario', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => window.location.pathname === '/home-page', null, { timeout: 15000 });
    assert.match(page.url(), /\/home-page$/,
      'A customer must be redirected away from the admin inventory route.');

    assert.ok(mockApiCalls.some(call => /GET \/api\/customers\/all$/.test(call)),
      'Browser role checks should exercise the customer-directory endpoint using intercepted fixtures.');
    assert.ok(mockApiCalls.some(call => /GET \/api\/products$/.test(call)),
      'Browser role checks should exercise the product endpoint using intercepted fixtures.');

    // Verify the administrator can cancel logout and that confirmed logout clears
    // all authentication keys. Network calls remain mocked; no live account is used.
    activeVisualRole = 'admin';
    await setVisualSession(adminUser);
    await page.goto(new URL('/home-page', baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('heading', { name: /Tu tienda, bajo control/i }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
    await page.getByRole('dialog', { name: /Quieres cerrar sesión/i }).waitFor();
    await page.getByRole('button', { name: 'Seguir aquí' }).click();
    await page.getByRole('dialog', { name: /Quieres cerrar sesión/i }).waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => localStorage.getItem('authToken')), 'browser-visual-only-token',
      'Cancelling logout must preserve the current session.');
    await page.getByRole('button', { name: 'Cerrar Sesión' }).click();
    await page.getByRole('dialog', { name: /Quieres cerrar sesión/i }).waitFor();
    await page.locator('.evh-logout-confirm').click();
    await page.waitForFunction(() => window.location.pathname === '/', null, { timeout: 15000 });
    await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: /Iniciar Sesión/i }).waitFor({ timeout: 15000 });
    const authAfterLogout = await page.evaluate(() => ({
      token: localStorage.getItem('authToken'),
      user: localStorage.getItem('userData'),
      userId: localStorage.getItem('userId')
    }));
    assert.deepEqual(authAfterLogout, { token: null, user: null, userId: null },
      'Confirmed logout must clear every authentication storage key.');
    console.log('Authenticated browser coverage passed. Admin/customer UI, role guards, safe form handling, and logout all ran with local fixtures; no live data was changed.');

    assert.deepEqual(pageErrors, [], 'JavaScript errors occurred in the preview: ' + pageErrors.join('; '));
    assert.deepEqual(assistantChatRequests, [], 'Browser acceptance must not call the paid generative chat API: ' + assistantChatRequests.join('; '));
    console.log('Responsive browser smoke passed: landing at 5 widths, 66-product mobile catalog, catalogue filters, 9 public routes, safe form validation, and a no-token AI fallback. Screenshots saved to ' + artifactsDir + '.');
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
