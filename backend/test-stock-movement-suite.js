require('dotenv').config();
const http = require('http');
const { sequelize } = require('./src/models');

const BASE_URL = 'http://localhost:5000/api';

async function runStockMovementSuite() {
  console.log('====================================================');
  console.log('    StockFlow Stock Movement History Test Suite     ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (details) console.error(`       Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  const timestamp = Date.now();
  let tokenA = '';
  let tokenB = '';
  let productAId = '';
  let movementInId = '';

  try {
    // 1. Setup Tenant A
    const resRegA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager OrgA',
        email: `manager_a_${timestamp}@testorg.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Org A Logistics ${timestamp}`
      })
    });
    const dataRegA = await resRegA.json();
    tokenA = dataRegA.data?.token;

    // 2. Setup Tenant B
    const resRegB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager OrgB',
        email: `manager_b_${timestamp}@testorg.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Org B Retail ${timestamp}`
      })
    });
    const dataRegB = await resRegB.json();
    tokenB = dataRegB.data?.token;

    assert(Boolean(tokenA) && Boolean(tokenB), 'Successfully registered Tenant A and Tenant B');

    // 3. Create Product for Tenant A with initial stock 50
    const resProdA = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Logitech MX Master 3S',
        sku: `MX3S-${timestamp}`,
        quantity_on_hand: 50,
        cost_price: 60.0,
        selling_price: 99.99,
        low_stock_threshold: 10
      })
    });
    const dataProdA = await resProdA.json();
    productAId = dataProdA.data?.id;

    assert(
      resProdA.status === 201 && dataProdA.data?.quantity_on_hand === 50,
      'Tenant A creates product with initial stock 50'
    );

    // 4. Verify initial stock movement was automatically recorded
    const resInitMov = await fetch(`${BASE_URL}/stock-movements/product/${productAId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataInitMov = await resInitMov.json();

    assert(
      resInitMov.status === 200 &&
        dataInitMov.data.length === 1 &&
        dataInitMov.data[0].movement_type === 'IN' &&
        dataInitMov.data[0].quantity === 50 &&
        dataInitMov.data[0].previous_quantity === 0 &&
        dataInitMov.data[0].new_quantity === 50,
      'Automatic initial IN stock movement recorded on product creation'
    );

    // 5. POST /api/stock-movements (Type: IN - Stock Receipt)
    const resMovIn = await fetch(`${BASE_URL}/stock-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        product_id: productAId,
        movement_type: 'IN',
        quantity: 25,
        reason: 'Supplier shipment delivery PO-981',
        reference_number: 'PO-981'
      })
    });
    const dataMovIn = await resMovIn.json();
    movementInId = dataMovIn.data?.movement?.id;

    assert(
      resMovIn.status === 201 &&
        dataMovIn.data?.movement?.movement_type === 'IN' &&
        dataMovIn.data?.movement?.quantity === 25 &&
        dataMovIn.data?.movement?.previous_quantity === 50 &&
        dataMovIn.data?.movement?.new_quantity === 75 &&
        dataMovIn.data?.product?.quantity_on_hand === 75,
      'POST /stock-movements (IN): increases product stock from 50 to 75'
    );

    // 6. POST /api/stock-movements (Type: OUT - Customer Dispatch)
    const resMovOut = await fetch(`${BASE_URL}/stock-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        product_id: productAId,
        movement_type: 'OUT',
        quantity: 15,
        reason: 'Customer sales dispatch SO-402',
        reference_number: 'SO-402'
      })
    });
    const dataMovOut = await resMovOut.json();

    assert(
      resMovOut.status === 201 &&
        dataMovOut.data?.movement?.movement_type === 'OUT' &&
        dataMovOut.data?.movement?.quantity === 15 &&
        dataMovOut.data?.movement?.previous_quantity === 75 &&
        dataMovOut.data?.movement?.new_quantity === 60 &&
        dataMovOut.data?.product?.quantity_on_hand === 60,
      'POST /stock-movements (OUT): decreases product stock from 75 to 60'
    );

    // 7. Negative stock prevention on OUT movement
    const resMovExcess = await fetch(`${BASE_URL}/stock-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        product_id: productAId,
        movement_type: 'OUT',
        quantity: 9999,
        reason: 'Oversized bulk dispatch test'
      })
    });
    const dataMovExcess = await resMovExcess.json();

    assert(
      resMovExcess.status === 400 &&
        dataMovExcess.success === false &&
        dataMovExcess.message.includes('Insufficient stock'),
      'POST /stock-movements prevents negative stock and rejects excessive deduction'
    );

    // 8. POST /api/stock-movements (Type: ADJUSTMENT - Decrease)
    const resMovAdj = await fetch(`${BASE_URL}/stock-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        product_id: productAId,
        movement_type: 'ADJUSTMENT',
        adjustment_type: 'DECREASE',
        quantity: 5,
        reason: 'Physical cycle count damage adjustment',
        reference_number: 'AUDIT-2026'
      })
    });
    const dataMovAdj = await resMovAdj.json();

    assert(
      resMovAdj.status === 201 &&
        dataMovAdj.data?.movement?.movement_type === 'ADJUSTMENT' &&
        dataMovAdj.data?.movement?.previous_quantity === 60 &&
        dataMovAdj.data?.movement?.new_quantity === 55 &&
        dataMovAdj.data?.product?.quantity_on_hand === 55,
      'POST /stock-movements (ADJUSTMENT): updates stock from 60 to 55'
    );

    // 9. Existing PATCH /api/products/:id/stock also records stock movement
    const resPatchStock = await fetch(`${BASE_URL}/products/${productAId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        adjustment_type: 'INCREASE',
        quantity: 10,
        note: 'Direct stock patch test'
      })
    });
    const dataPatchStock = await resPatchStock.json();

    assert(
      resPatchStock.status === 200 &&
        dataPatchStock.data?.quantity_on_hand === 65 &&
        Boolean(dataPatchStock.meta?.movement_id),
      'PATCH /products/:id/stock updates stock to 65 and creates movement audit record'
    );

    // 10. GET /api/stock-movements (Pagination and data integrity)
    const resListAll = await fetch(`${BASE_URL}/stock-movements`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataListAll = await resListAll.json();

    assert(
      resListAll.status === 200 &&
        dataListAll.success === true &&
        dataListAll.data.length >= 5 &&
        dataListAll.data[0].product?.name === 'Logitech MX Master 3S' &&
        dataListAll.data[0].creator?.email !== undefined,
      'GET /stock-movements returns paginated movements with product and creator info'
    );

    // 11. GET /api/stock-movements with movement_type filter
    const resFilterIn = await fetch(`${BASE_URL}/stock-movements?movement_type=IN`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataFilterIn = await resFilterIn.json();

    assert(
      resFilterIn.status === 200 &&
        dataFilterIn.data.every((m) => m.movement_type === 'IN'),
      'GET /stock-movements?movement_type=IN filters movements strictly by type IN'
    );

    // 12. GET /api/stock-movements with search filter
    const resSearch = await fetch(`${BASE_URL}/stock-movements?search=PO-981`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataSearch = await resSearch.json();

    assert(
      resSearch.status === 200 &&
        dataSearch.data.length >= 1 &&
        dataSearch.data.some((m) => m.reference_number === 'PO-981'),
      'GET /stock-movements?search=PO-981 filters by reference number'
    );

    // 13. GET /api/stock-movements/:id
    const resGetSingle = await fetch(`${BASE_URL}/stock-movements/${movementInId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataGetSingle = await resGetSingle.json();

    assert(
      resGetSingle.status === 200 &&
        dataGetSingle.data?.id === movementInId &&
        dataGetSingle.data?.product?.name === 'Logitech MX Master 3S',
      'GET /stock-movements/:id retrieves individual movement details'
    );

    // 14. GET /api/stock-movements/product/:productId
    const resByProduct = await fetch(`${BASE_URL}/stock-movements/product/${productAId}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataByProduct = await resByProduct.json();

    assert(
      resByProduct.status === 200 &&
        dataByProduct.data.every((m) => m.product_id === productAId),
      'GET /stock-movements/product/:productId retrieves movements for specific product'
    );

    // 15. MULTI-TENANCY: Tenant B cannot access Tenant A's stock movement by ID
    const resCrossId = await fetch(`${BASE_URL}/stock-movements/${movementInId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(
      resCrossId.status === 404,
      'Tenant B cannot access Tenant A stock movement by ID (returns 404 Not Found)'
    );

    // 16. MULTI-TENANCY: Tenant B cannot access Tenant A's product movements
    const resCrossProd = await fetch(`${BASE_URL}/stock-movements/product/${productAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(
      resCrossProd.status === 404,
      "Tenant B cannot view Tenant A product's movements (returns 404 Not Found)"
    );

    // 17. MULTI-TENANCY: Tenant B cannot record stock movement against Tenant A's product
    const resCrossCreate = await fetch(`${BASE_URL}/stock-movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        product_id: productAId,
        movement_type: 'IN',
        quantity: 10,
        reason: 'Illegal cross-tenant stock injection'
      })
    });
    assert(
      resCrossCreate.status === 404,
      "Tenant B cannot record stock movement for Tenant A's product (returns 404 Not Found)"
    );

    // 18. MULTI-TENANCY: Tenant B's movements list is completely isolated
    const resListB = await fetch(`${BASE_URL}/stock-movements`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dataListB = await resListB.json();

    assert(
      resListB.status === 200 && dataListB.data.length === 0,
      "Tenant B's stock movements list contains 0 items from Tenant A"
    );

  } catch (err) {
    console.error('Test suite runtime error:', err);
  } finally {
    console.log('\n====================================================');
    console.log(`Stock Movement Test Results: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runStockMovementSuite();
