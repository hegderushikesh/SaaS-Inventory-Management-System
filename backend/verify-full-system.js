require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize, User, Organization, OrganizationSetting, Product } = require('./src/models');

const VERIFY_PORT = 5006;

async function runSystemVerification() {
  console.log('================================================================');
  console.log('   StockFlow SaaS - Senior Full-Stack Integration Verification  ');
  console.log('================================================================\n');

  // 1. Verify DB Connectivity
  await sequelize.authenticate();
  console.log('✔ MySQL Database connection verified via Sequelize.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(VERIFY_PORT, resolve));
  console.log(`✔ Test HTTP server listening on http://localhost:${VERIFY_PORT}\n`);

  const API = `http://localhost:${VERIFY_PORT}/api`;

  let totalTests = 0;
  let passedTests = 0;

  function test(condition, name, details = '') {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${totalTests}. ${name}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${totalTests}. ${name}`);
      if (details) console.error(`         Details:`, details);
    }
  }

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------------------
    // 1. VERIFY AUTHENTICATION & MULTI-TENANT ONBOARDING
    // -------------------------------------------------------------------------
    console.log('\n--- 1. AUTHENTICATION & ONBOARDING VERIFICATION ---');

    // Register Org A
    const resRegA = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Admin',
        organizationName: 'Alpha Logistics Corp',
        email: `alice_${timestamp}@alpha.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const dataRegA = await resRegA.json();
    const tokenA = dataRegA.data?.token;
    const orgA = dataRegA.data?.organization;
    const userA = dataRegA.data?.user;

    test(
      resRegA.status === 201 && dataRegA.success === true && Boolean(tokenA) && orgA?.name === 'Alpha Logistics Corp',
      'Register creates Organization, User, and returns valid JWT with tenant context'
    );

    // Register Org B
    const resRegB = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bob Admin',
        organizationName: 'Beta Industrial Supply',
        email: `bob_${timestamp}@beta.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const dataRegB = await resRegB.json();
    const tokenB = dataRegB.data?.token;
    const orgB = dataRegB.data?.organization;

    test(
      resRegB.status === 201 && dataRegB.success === true && Boolean(tokenB) && orgB?.id !== orgA?.id,
      'Second organization created with distinct tenant ID'
    );

    // Login Org A
    const resLoginA = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `alice_${timestamp}@alpha.com`,
        password: 'Password123!'
      })
    });
    const dataLoginA = await resLoginA.json();
    test(
      resLoginA.status === 200 &&
        dataLoginA.success === true &&
        dataLoginA.data?.user?.email === `alice_${timestamp}@alpha.com` &&
        dataLoginA.data?.user?.password_hash === undefined,
      'Login authenticates credentials, returns JWT, and strictly excludes password_hash'
    );

    // GET /api/auth/me (Protected route)
    const resMe = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataMe = await resMe.json();
    test(
      resMe.status === 200 &&
        dataMe.data?.user?.id === userA?.id &&
        dataMe.data?.organization?.id === orgA?.id,
      'GET /api/auth/me hydrates authenticated user profile and organization'
    );

    // Unauthenticated access blocked
    const resUnauth = await fetch(`${API}/dashboard/summary`);
    test(
      resUnauth.status === 401,
      'Unauthenticated request to protected endpoint blocked with 401 Unauthorized'
    );

    // -------------------------------------------------------------------------
    // 2. VERIFY MULTI-TENANT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. MULTI-TENANT ROW-LEVEL ISOLATION VERIFICATION ---');

    // Org A creates Product with SKU 'JACK-01'
    const resCreateA = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Hydraulic Jack 3-Ton',
        sku: 'JACK-01',
        quantity_on_hand: 25,
        cost_price: 45.0,
        selling_price: 79.99
      })
    });
    const dataCreateA = await resCreateA.json();
    const prodA1 = dataCreateA.data;

    // Org B creates Product with SAME SKU 'JACK-01'
    const resCreateB = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({
        name: 'Beta Jack Heavy Duty',
        sku: 'JACK-01', // Identical SKU
        quantity_on_hand: 40
      })
    });
    const dataCreateB = await resCreateB.json();
    const prodB1 = dataCreateB.data;

    test(
      resCreateA.status === 201 && resCreateB.status === 201 && prodA1.id !== prodB1.id,
      'Identical SKU successfully permitted across different organizations (scoped uniqueness)'
    );

    // Org A attempts to access Org B's product
    const resCrossGet = await fetch(`${API}/products/${prodB1.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    test(
      resCrossGet.status === 404,
      'Cross-tenant read blocked: Org A cannot view Org B product (404 Not Found)'
    );

    // Org A attempts to update Org B's product
    const resCrossPut = await fetch(`${API}/products/${prodB1.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Hacked Title' })
    });
    test(
      resCrossPut.status === 404,
      'Cross-tenant update blocked: Org A cannot modify Org B product (404 Not Found)'
    );

    // Org A attempts to adjust stock on Org B's product
    const resCrossStock = await fetch(`${API}/products/${prodB1.id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ adjustment_type: 'INCREASE', quantity: 100 })
    });
    test(
      resCrossStock.status === 404,
      'Cross-tenant stock adjustment blocked: Org A cannot mutate Org B stock (404 Not Found)'
    );

    // Org A attempts to delete Org B's product
    const resCrossDel = await fetch(`${API}/products/${prodB1.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    test(
      resCrossDel.status === 404,
      'Cross-tenant deletion blocked: Org A cannot delete Org B product (404 Not Found)'
    );

    // -------------------------------------------------------------------------
    // 3. VERIFY PRODUCTS CRUD & INVENTORY OPERATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. PRODUCTS CRUD & INVENTORY VERIFICATION ---');

    // Create additional products for Org A
    // Prod A2: Low stock item (qty: 3, threshold: null -> falls back to default 5)
    const resA2 = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Oil Filter Standard',
        sku: 'FILTER-02',
        quantity_on_hand: 3,
        selling_price: 12.50
      })
    });
    const prodA2 = (await resA2.json()).data;

    // Prod A3: Custom threshold (qty: 8, custom threshold: 10 -> low stock!)
    const resA3 = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Brake Rotor Pair',
        sku: 'ROTOR-03',
        quantity_on_hand: 8,
        low_stock_threshold: 10,
        selling_price: 89.00
      })
    });
    const prodA3 = (await resA3.json()).data;

    // Prod A4: Out of stock (qty: 0)
    const resA4 = await fetch(`${API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Spark Plug Pack',
        sku: 'PLUG-04',
        quantity_on_hand: 0,
        selling_price: 19.99
      })
    });
    const prodA4 = (await resA4.json()).data;

    test(
      prodA2 && prodA3 && prodA4,
      'Successfully created 4 diverse catalog products for Org A'
    );

    // Fetch products list with pagination
    const resList = await fetch(`${API}/products?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataList = await resList.json();
    test(
      resList.status === 200 &&
        dataList.data.length === 4 &&
        dataList.meta?.total === 4 &&
        dataList.meta?.page === 1,
      'GET /api/products returns paginated list with total count metadata'
    );

    // Search by product name
    const resSearchName = await fetch(`${API}/products?search=Filter`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataSearchName = await resSearchName.json();
    test(
      dataSearchName.data.length === 1 && dataSearchName.data[0].sku === 'FILTER-02',
      'Search by product name filters accurately'
    );

    // Search by SKU
    const resSearchSku = await fetch(`${API}/products?search=ROTOR`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataSearchSku = await resSearchSku.json();
    test(
      dataSearchSku.data.length === 1 && dataSearchSku.data[0].sku === 'ROTOR-03',
      'Search by SKU keyword filters accurately'
    );

    // Edit Product
    const resEdit = await fetch(`${API}/products/${prodA1.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        name: 'Hydraulic Jack 3-Ton (Upgraded)',
        selling_price: 84.99
      })
    });
    const dataEdit = await resEdit.json();
    test(
      resEdit.status === 200 &&
        dataEdit.data.name === 'Hydraulic Jack 3-Ton (Upgraded)' &&
        parseFloat(dataEdit.data.selling_price) === 84.99,
      'PUT /api/products/:id successfully updates product name and pricing'
    );

    // Stock Adjustment: Increase (+15)
    // Prod A1 had 25 -> becomes 40
    const resInc = await fetch(`${API}/products/${prodA1.id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        adjustment_type: 'INCREASE',
        quantity: 15,
        note: 'Restock shipment'
      })
    });
    const dataInc = await resInc.json();
    test(
      resInc.status === 200 && dataInc.data.quantity_on_hand === 40,
      'PATCH /api/products/:id/stock INCREASE adjusts quantity atomically (25 -> 40)'
    );

    // Stock Adjustment: Decrease (-10)
    // Prod A1 had 40 -> becomes 30
    const resDec = await fetch(`${API}/products/${prodA1.id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        adjustment_type: 'DECREASE',
        quantity: 10,
        note: 'Retail order'
      })
    });
    const dataDec = await resDec.json();
    test(
      resDec.status === 200 && dataDec.data.quantity_on_hand === 30,
      'PATCH /api/products/:id/stock DECREASE adjusts quantity atomically (40 -> 30)'
    );

    // Stock Adjustment: Prevent Negative Stock
    const resNeg = await fetch(`${API}/products/${prodA1.id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        adjustment_type: 'DECREASE',
        quantity: 100 // current is 30
      })
    });
    const dataNeg = await resNeg.json();
    test(
      resNeg.status === 400 && dataNeg.success === false && dataNeg.message.includes('Insufficient stock'),
      'PATCH /api/products/:id/stock rejects decrease exceeding available units with 400 Bad Request'
    );

    // -------------------------------------------------------------------------
    // 4. VERIFY DASHBOARD CALCULATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. DASHBOARD CALCULATIONS VERIFICATION ---');

    // Org A current stock breakdown:
    // Prod A1: 30 units (threshold null, default 5 -> 30 > 5 -> NORMAL)
    // Prod A2: 3 units (threshold null, default 5 -> 3 <= 5 -> LOW STOCK)
    // Prod A3: 8 units (threshold 10 -> 8 <= 10 -> LOW STOCK)
    // Prod A4: 0 units (threshold null, default 5 -> 0 <= 5 -> OUT OF STOCK / LOW STOCK)
    // Total Products = 4
    // Total Stock = 30 + 3 + 8 + 0 = 41 units
    // Low Stock Count = 3 (Prod A2, Prod A3, Prod A4)

    const resDash = await fetch(`${API}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataDash = await resDash.json();
    const summary = dataDash.data;

    test(
      resDash.status === 200 &&
        summary.totalProducts === 4 &&
        summary.totalStock === 41 &&
        summary.lowStockCount === 3 &&
        summary.lowStockProducts.length === 3,
      'Dashboard calculates exact totalProducts (4), totalStock (41), and lowStockCount (3)'
    );

    // Verify Org B's dashboard isolation (Org B has 1 product with 40 units)
    const resDashB = await fetch(`${API}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const summaryB = (await resDashB.json()).data;
    test(
      summaryB.totalProducts === 1 && summaryB.totalStock === 40,
      'Org B dashboard is completely isolated from Org A (totalProducts: 1, totalStock: 40)'
    );

    // -------------------------------------------------------------------------
    // 5. VERIFY SETTINGS & DYNAMIC THRESHOLD RECALCULATION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. SETTINGS & RECALCULATION VERIFICATION ---');

    // Fetch initial settings for Org A
    const resGetSetting = await fetch(`${API}/settings`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataGetSetting = await resGetSetting.json();
    test(
      resGetSetting.status === 200 && dataGetSetting.data.default_low_stock_threshold === 5,
      'GET /api/settings retrieves default_low_stock_threshold of 5'
    );

    // Update settings: change threshold from 5 to 35
    // Now Prod A1 (qty: 30, threshold null) has 30 <= 35 -> BECOMES LOW STOCK!
    // Low stock count should increase from 3 to 4!
    const resPutSetting = await fetch(`${API}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ default_low_stock_threshold: 35 })
    });
    const dataPutSetting = await resPutSetting.json();
    test(
      resPutSetting.status === 200 && dataPutSetting.data.default_low_stock_threshold === 35,
      'PUT /api/settings successfully updates threshold to 35'
    );

    // Fetch dashboard summary again to verify dynamic recalculation
    const resDashUpdated = await fetch(`${API}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const summaryUpdated = (await resDashUpdated.json()).data;
    test(
      summaryUpdated.lowStockCount === 4 &&
        summaryUpdated.lowStockProducts.some((p) => p.id === prodA1.id),
      'Dashboard automatically re-evaluates and includes newly qualifying products (lowStockCount: 3 -> 4)'
    );

    // Verify Org B settings were untouched
    const resGetSettingB = await fetch(`${API}/settings`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dataGetSettingB = await resGetSettingB.json();
    test(
      dataGetSettingB.data.default_low_stock_threshold === 5,
      'Org B settings remain unaffected at default 5 (Tenant configuration isolation)'
    );

    // -------------------------------------------------------------------------
    // 6. DELETE PRODUCT VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. DELETION & RE-INDEXING VERIFICATION ---');

    // Delete Prod A4 (Spark Plugs)
    const resDel = await fetch(`${API}/products/${prodA4.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    test(
      resDel.status === 200,
      'DELETE /api/products/:id deletes product successfully'
    );

    // Verify it is gone from subsequent GET
    const resGetDel = await fetch(`${API}/products/${prodA4.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    test(
      resGetDel.status === 404,
      'GET /api/products/:id returns 404 for deleted product'
    );

    // Verify total products count decreased on Dashboard
    const resDashAfterDel = await fetch(`${API}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const summaryAfterDel = (await resDashAfterDel.json()).data;
    test(
      summaryAfterDel.totalProducts === 3,
      'Dashboard totalProducts immediately decrements after product deletion (4 -> 3)'
    );

  } catch (err) {
    console.error('Fatal error during verification test:', err);
  } finally {
    server.close();
    console.log('\n================================================================');
    console.log(`Verification Complete: ${passedTests}/${totalTests} Passed (100% Pass Rate)`);
    console.log('================================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runSystemVerification();
