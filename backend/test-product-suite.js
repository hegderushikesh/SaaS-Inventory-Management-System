require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize } = require('./src/models');

const TEST_PORT = 5002;

async function runProductSuite() {
  console.log('====================================================');
  console.log('    StockFlow Product & Inventory Test Suite        ');
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
  let tokenA = '';
  let orgAId = '';
  let tokenB = '';
  let orgBId = '';

  try {
    // Setup Tenant A
    const resRegA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice OrgA',
        email: `alice_${timestamp}@testorg-a.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Tenant Alpha'
      })
    });
    const dataRegA = await resRegA.json();
    tokenA = dataRegA.data.token;
    orgAId = dataRegA.data.organization.id;

    // Setup Tenant B
    const resRegB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob OrgB',
        email: `bob_${timestamp}@testorg-b.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: 'Tenant Beta'
      })
    });
    const dataRegB = await resRegB.json();
    tokenB = dataRegB.data.token;
    orgBId = dataRegB.data.organization.id;

    console.log(`Setup complete: Tenant Alpha (${orgAId}) & Tenant Beta (${orgBId})\n`);

    // --- TEST 1: Unauthenticated request to /api/products ---
    const resNoAuth = await fetch(`${BASE_URL}/products`);
    assert(
      resNoAuth.status === 401,
      'GET /api/products rejects unauthenticated request with 401'
    );

    // --- TEST 2: Validation on product creation ---
    const resValFail = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: '',
        sku: '',
        quantity_on_hand: -5
      })
    });
    const dataValFail = await resValFail.json();
    assert(
      resValFail.status === 400 && dataValFail.success === false && dataValFail.errors.length >= 3,
      'POST /api/products validates required fields and non-negative quantity',
      dataValFail
    );

    // --- TEST 3: Create product for Tenant Alpha ---
    const resCreateA = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'MacBook Pro 16',
        sku: 'MBP16-M3',
        description: 'Apple Silicon Laptop',
        quantity_on_hand: 20,
        cost_price: 2000.0,
        selling_price: 2499.99,
        low_stock_threshold: 5
      })
    });
    const dataCreateA = await resCreateA.json();
    const productA = dataCreateA.data;
    assert(
      resCreateA.status === 201 &&
        dataCreateA.success === true &&
        productA.name === 'MacBook Pro 16' &&
        productA.sku === 'MBP16-M3' &&
        productA.quantity_on_hand === 20,
      'POST /api/products successfully creates a product for Tenant Alpha',
      dataCreateA
    );

    // --- TEST 4: Duplicate SKU inside same tenant should fail (409) ---
    const resDupA = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Another MacBook',
        sku: 'MBP16-M3',
        quantity_on_hand: 5
      })
    });
    const dataDupA = await resDupA.json();
    assert(
      resDupA.status === 409 && dataDupA.success === false,
      'POST /api/products rejects duplicate SKU within the same organization with 409 Conflict',
      dataDupA
    );

    // --- TEST 5: Same SKU in Tenant Beta SHOULD SUCCEED (Multi-tenant SKU scoping) ---
    const resCreateB = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        name: 'Tenant B MacBook',
        sku: 'MBP16-M3', // Same SKU!
        quantity_on_hand: 10
      })
    });
    const dataCreateB = await resCreateB.json();
    assert(
      resCreateB.status === 201 && dataCreateB.success === true,
      'POST /api/products permits identical SKU across different organizations (Row-level isolation)',
      dataCreateB
    );

    // --- Create a second product for Tenant Alpha for pagination/search tests ---
    await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Wireless Mouse',
        sku: 'WM-LOGI',
        quantity_on_hand: 50,
        selling_price: 29.99
      })
    });

    // --- TEST 6: GET /api/products returns strictly Tenant Alpha products with pagination metadata ---
    const resListA = await fetch(`${BASE_URL}/products?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataListA = await resListA.json();
    assert(
      resListA.status === 200 &&
        dataListA.data.length === 2 &&
        dataListA.meta.total === 2 &&
        dataListA.meta.page === 1 &&
        dataListA.data.every((p) => p.organization_id === orgAId),
      'GET /api/products returns only Tenant Alpha products with pagination meta',
      dataListA
    );

    // --- TEST 7: Search by product name ---
    const resSearchName = await fetch(`${BASE_URL}/products?search=Mouse`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataSearchName = await resSearchName.json();
    assert(
      resSearchName.status === 200 &&
        dataSearchName.data.length === 1 &&
        dataSearchName.data[0].sku === 'WM-LOGI',
      'GET /api/products searches effectively by product name',
      dataSearchName
    );

    // --- TEST 8: Search by SKU ---
    const resSearchSku = await fetch(`${BASE_URL}/products?search=MBP16`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataSearchSku = await resSearchSku.json();
    assert(
      resSearchSku.status === 200 &&
        dataSearchSku.data.length === 1 &&
        dataSearchSku.data[0].sku === 'MBP16-M3',
      'GET /api/products searches effectively by SKU',
      dataSearchSku
    );

    // --- TEST 9: Cross-tenant isolation on GET /api/products/:id ---
    // Bob (Tenant B) tries to read Alice's (Tenant A) product
    const resCrossGet = await fetch(`${BASE_URL}/products/${productA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dataCrossGet = await resCrossGet.json();
    assert(
      resCrossGet.status === 404 && dataCrossGet.success === false,
      'GET /api/products/:id blocks cross-tenant product access with 404 Not Found',
      dataCrossGet
    );

    // --- TEST 10: GET /api/products/:id for product owner ---
    const resGetOwner = await fetch(`${BASE_URL}/products/${productA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataGetOwner = await resGetOwner.json();
    assert(
      resGetOwner.status === 200 && dataGetOwner.data.id === productA.id,
      'GET /api/products/:id returns product details to owner tenant',
      dataGetOwner
    );

    // --- TEST 11: PUT /api/products/:id update details ---
    const resUpdate = await fetch(`${BASE_URL}/products/${productA.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'MacBook Pro 16 M3 Max',
        selling_price: 2699.99
      })
    });
    const dataUpdate = await resUpdate.json();
    assert(
      resUpdate.status === 200 &&
        dataUpdate.data.name === 'MacBook Pro 16 M3 Max' &&
        parseFloat(dataUpdate.data.selling_price) === 2699.99,
      'PUT /api/products/:id updates product details correctly',
      dataUpdate
    );

    // --- TEST 12: PUT /api/products/:id cross-tenant block ---
    const resCrossPut = await fetch(`${BASE_URL}/products/${productA.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ name: 'Hacked Laptop' })
    });
    assert(
      resCrossPut.status === 404,
      'PUT /api/products/:id prevents cross-tenant modifications with 404',
      await resCrossPut.json()
    );

    // --- TEST 13: PATCH /api/products/:id/stock INCREASE ---
    const resStockInc = await fetch(`${BASE_URL}/products/${productA.id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        adjustment_type: 'INCREASE',
        quantity: 15,
        note: 'Restock shipment arrived'
      })
    });
    const dataStockInc = await resStockInc.json();
    assert(
      resStockInc.status === 200 &&
        dataStockInc.data.quantity_on_hand === 35 && // 20 + 15 = 35
        dataStockInc.meta.new_quantity === 35,
      'PATCH /api/products/:id/stock increases stock atomically (20 -> 35)',
      dataStockInc
    );

    // --- TEST 14: PATCH /api/products/:id/stock DECREASE ---
    const resStockDec = await fetch(`${BASE_URL}/products/${productA.id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        adjustment_type: 'DECREASE',
        quantity: 10,
        note: 'Customer order fulfilled'
      })
    });
    const dataStockDec = await resStockDec.json();
    assert(
      resStockDec.status === 200 &&
        dataStockDec.data.quantity_on_hand === 25, // 35 - 10 = 25
      'PATCH /api/products/:id/stock decreases stock atomically (35 -> 25)',
      dataStockDec
    );

    // --- TEST 15: PATCH stock decrease below zero rejected with 400 ---
    const resStockBelowZero = await fetch(`${BASE_URL}/products/${productA.id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        adjustment_type: 'DECREASE',
        quantity: 100 // current is 25
      })
    });
    const dataStockBelowZero = await resStockBelowZero.json();
    assert(
      resStockBelowZero.status === 400 &&
        dataStockBelowZero.success === false &&
        dataStockBelowZero.message.includes('Insufficient stock'),
      'PATCH /api/products/:id/stock prevents negative inventory with 400 Bad Request',
      dataStockBelowZero
    );

    // --- TEST 16: DELETE /api/products/:id cross-tenant block ---
    const resCrossDel = await fetch(`${BASE_URL}/products/${productA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(
      resCrossDel.status === 404,
      'DELETE /api/products/:id prevents cross-tenant deletion with 404',
      await resCrossDel.json()
    );

    // --- TEST 17: DELETE /api/products/:id by owner ---
    const resDelOwner = await fetch(`${BASE_URL}/products/${productA.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataDelOwner = await resDelOwner.json();
    assert(
      resDelOwner.status === 200 && dataDelOwner.success === true,
      'DELETE /api/products/:id deletes product successfully for owner tenant',
      dataDelOwner
    );

    // --- TEST 18: GET /api/products/:id after delete returns 404 ---
    const resGetDeleted = await fetch(`${BASE_URL}/products/${productA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(
      resGetDeleted.status === 404,
      'GET /api/products/:id returns 404 for deleted product',
      await resGetDeleted.json()
    );

  } catch (err) {
    console.error('Unexpected error during test execution:', err);
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`Product Suite Results: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runProductSuite();
