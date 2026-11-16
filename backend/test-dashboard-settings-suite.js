require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');

const TEST_PORT = 5003;

async function runDashboardSettingsSuite() {
  console.log('====================================================');
  console.log('    StockFlow Dashboard & Settings Test Suite       ');
  console.log('====================================================\n');

  await sequelize.authenticate();
  console.log('✔ MySQL Database connected successfully.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✔ Test HTTP server listening on http://localhost:${TEST_PORT}\n`);

  const BASE_URL = `http://localhost:${TEST_PORT}/api`;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (details) console.error(`       Details: ${JSON.stringify(details)}`);
    }
  }

  const timestamp = Date.now();
  let token1 = '';
  let token2 = '';

  try {
    // 1. Setup Tenant 1
    const resReg1 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager 1',
        email: `manager1_${timestamp}@gadgets.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Gadget World Inc'
      })
    });
    const dataReg1 = await resReg1.json();
    token1 = dataReg1.data.token;

    // 2. Setup Tenant 2
    const resReg2 = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager 2',
        email: `manager2_${timestamp}@books.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Book Barn'
      })
    });
    const dataReg2 = await resReg2.json();
    token2 = dataReg2.data.token;

    // --- TEST 1: Initial empty dashboard for Tenant 1 ---
    const resEmptyDash = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const dataEmptyDash = await resEmptyDash.json();
    assert(
      resEmptyDash.status === 200 &&
        dataEmptyDash.data.totalProducts === 0 &&
        dataEmptyDash.data.totalStock === 0 &&
        dataEmptyDash.data.lowStockCount === 0 &&
        Array.isArray(dataEmptyDash.data.lowStockProducts) &&
        dataEmptyDash.data.lowStockProducts.length === 0,
      'GET /api/dashboard/summary handles zero-product state cleanly',
      dataEmptyDash
    );

    // --- TEST 2: GET /api/settings returns default threshold of 5 ---
    const resSettings = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const dataSettings = await resSettings.json();
    assert(
      resSettings.status === 200 &&
        dataSettings.data.default_low_stock_threshold === 5,
      'GET /api/settings returns initial default_low_stock_threshold: 5',
      dataSettings
    );

    // --- Create 6 Products with various quantities and thresholds for Tenant 1 ---
    // P1: qty 2, threshold null (default 5) -> 2 <= 5 -> LOW STOCK
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Product 1', sku: 'P1-NULL-2', quantity_on_hand: 2, low_stock_threshold: null })
    });

    // P2: qty 5, threshold null (default 5) -> 5 <= 5 -> LOW STOCK (boundary condition)
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Product 2', sku: 'P2-NULL-5', quantity_on_hand: 5, low_stock_threshold: null })
    });

    // P3: qty 6, threshold null (default 5) -> 6 > 5 -> NORMAL STOCK
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Product 3', sku: 'P3-NULL-6', quantity_on_hand: 6, low_stock_threshold: null })
    });

    // P4: qty 10, custom threshold 15 -> 10 <= 15 -> LOW STOCK
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Product 4', sku: 'P4-CUST-10', quantity_on_hand: 10, low_stock_threshold: 15 })
    });

    // P5: qty 16, custom threshold 15 -> 16 > 15 -> NORMAL STOCK
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Product 5', sku: 'P5-CUST-16', quantity_on_hand: 16, low_stock_threshold: 15 })
    });

    // P6: qty 4, custom threshold 3 -> 4 > 3 -> NORMAL STOCK (even though 4 <= default 5, individual threshold 3 takes precedence)
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ name: 'Product 6', sku: 'P6-CUST-4', quantity_on_hand: 4, low_stock_threshold: 3 })
    });

    // --- TEST 3: Verify Dashboard Calculations ---
    // Total products: 6
    // Total stock: 2 + 5 + 6 + 10 + 16 + 4 = 43
    // Low stock count: 3 (P1, P2, P4)
    const resDash1 = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const dataDash1 = await resDash1.json();
    assert(
      resDash1.status === 200 &&
        dataDash1.data.totalProducts === 6 &&
        dataDash1.data.totalStock === 43 &&
        dataDash1.data.lowStockCount === 3 &&
        dataDash1.data.lowStockProducts.length === 3,
      'GET /api/dashboard/summary correctly computes totalProducts(6), totalStock(43), and lowStockCount(3)',
      dataDash1
    );

    // --- TEST 4: Low stock product payload properties ---
    const lowP1 = dataDash1.data.lowStockProducts.find((p) => p.sku === 'P1-NULL-2');
    const lowP4 = dataDash1.data.lowStockProducts.find((p) => p.sku === 'P4-CUST-10');
    assert(
      lowP1 &&
        lowP1.effective_low_stock_threshold === 5 &&
        lowP4 &&
        lowP4.effective_low_stock_threshold === 15,
      'lowStockProducts contains effective_low_stock_threshold falling back to org default or individual',
      { lowP1, lowP4 }
    );

    // --- TEST 5: Validate PUT /api/settings rejects negative threshold ---
    const resNegSetting = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ default_low_stock_threshold: -3 })
    });
    const dataNegSetting = await resNegSetting.json();
    assert(
      resNegSetting.status === 400 && dataNegSetting.success === false,
      'PUT /api/settings validates non-negative integer for default_low_stock_threshold',
      dataNegSetting
    );

    // --- TEST 6: Update default_low_stock_threshold to 7 ---
    const resUpdateSetting = await fetch(`${BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ default_low_stock_threshold: 7 })
    });
    const dataUpdateSetting = await resUpdateSetting.json();
    assert(
      resUpdateSetting.status === 200 &&
        dataUpdateSetting.data.default_low_stock_threshold === 7,
      'PUT /api/settings successfully updates default_low_stock_threshold to 7',
      dataUpdateSetting
    );

    // --- TEST 7: Dynamic threshold reflection on Dashboard ---
    // With default now = 7:
    // P3 (qty 6, threshold null) now has 6 <= 7 -> BECOMES LOW STOCK!
    // P6 (qty 4, custom threshold 3) still has 4 > 3 -> REMAINS NORMAL STOCK!
    // New lowStockCount should be 4 (P1, P2, P3, P4)
    const resDash2 = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const dataDash2 = await resDash2.json();
    assert(
      resDash2.status === 200 &&
        dataDash2.data.lowStockCount === 4 &&
        dataDash2.data.lowStockProducts.some((p) => p.sku === 'P3-NULL-6'),
      'Dashboard dynamically re-evaluates low stock items after default threshold update (count: 3 -> 4)',
      dataDash2
    );

    // --- TEST 8: Tenant 2 isolation check ---
    // Tenant 2 has 0 products and should not see Tenant 1's products or altered settings
    const resDashTenant2 = await fetch(`${BASE_URL}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const dataDashTenant2 = await resDashTenant2.json();
    const resSettingsTenant2 = await fetch(`${BASE_URL}/settings`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const dataSettingsTenant2 = await resSettingsTenant2.json();
    assert(
      resDashTenant2.status === 200 &&
        dataDashTenant2.data.totalProducts === 0 &&
        dataDashTenant2.data.totalStock === 0 &&
        dataSettingsTenant2.data.default_low_stock_threshold === 5, // Default is still 5 for Tenant 2!
      'Multi-tenant isolation verified: Tenant 2 retains independent dashboard and independent default settings',
      { dataDashTenant2, dataSettingsTenant2 }
    );

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`Dashboard & Settings Suite Results: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runDashboardSettingsSuite();
