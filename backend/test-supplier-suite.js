require('dotenv').config();

const BASE_URL = 'http://localhost:5000/api';

async function runSupplierSuite() {
  console.log('====================================================');
  console.log('       StockFlow Supplier Management Test Suite     ');
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
  let supplierA1Id = '';
  let supplierA2Id = '';
  let productAId = '';
  let poAId = '';

  try {
    // 1. Setup Tenant A
    const resRegA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manager OrgA',
        email: `manager_supp_a_${timestamp}@testorg.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Org A Suppliers Inc ${timestamp}`
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
        email: `manager_supp_b_${timestamp}@testorg.com`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        organizationName: `Org B Procurement ${timestamp}`
      })
    });
    const dataRegB = await resRegB.json();
    tokenB = dataRegB.data?.token;

    assert(Boolean(tokenA) && Boolean(tokenB), 'Successfully registered Tenant A and Tenant B');

    // 3. POST /api/suppliers - Validation error on missing supplier_name
    const resValFail = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        email: 'invalid@supplier.com'
      })
    });
    const dataValFail = await resValFail.json();
    assert(
      resValFail.status === 400 && dataValFail.success === false,
      'POST /suppliers rejects request when supplier_name is missing'
    );

    // 4. POST /api/suppliers - Successfully create Supplier 1
    const resSupA1 = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        supplier_name: 'TechLogix Global Solutions',
        company_name: 'TechLogix Distribution LLC',
        email: 'sales@techlogix.com',
        phone: '+1 (555) 389-2041',
        address: '400 Silicon Avenue, Suite 200, San Jose, CA',
        notes: 'Primary hardware distributor. Net 30 payment terms.'
      })
    });
    const dataSupA1 = await resSupA1.json();
    supplierA1Id = dataSupA1.data?.id;

    assert(
      resSupA1.status === 201 &&
        dataSupA1.success === true &&
        dataSupA1.data?.supplier_name === 'TechLogix Global Solutions' &&
        dataSupA1.data?.company_name === 'TechLogix Distribution LLC' &&
        dataSupA1.data?.email === 'sales@techlogix.com' &&
        dataSupA1.data?.phone === '+1 (555) 389-2041',
      'POST /suppliers creates supplier with complete contact info'
    );

    // 5. POST /api/suppliers - Create second Supplier 2 for Tenant A
    const resSupA2 = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        supplier_name: 'FastPack Packaging Co',
        company_name: 'FastPack Packaging Materials',
        email: 'orders@fastpack.com',
        phone: '+1 (555) 902-1144',
        address: '88 Box Way, Chicago, IL',
        notes: 'Boxes and bubble wrap supplies.'
      })
    });
    const dataSupA2 = await resSupA2.json();
    supplierA2Id = dataSupA2.data?.id;

    assert(
      resSupA2.status === 201 && Boolean(supplierA2Id),
      'POST /suppliers creates second supplier for Tenant A'
    );

    // 6. GET /api/suppliers - List suppliers with pagination
    const resList = await fetch(`${BASE_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataList = await resList.json();

    assert(
      resList.status === 200 &&
        dataList.success === true &&
        dataList.data.length >= 2 &&
        Boolean(dataList.meta?.total),
      'GET /suppliers returns paginated list of organization suppliers'
    );

    // 7. GET /api/suppliers - Search filter
    const resSearch = await fetch(`${BASE_URL}/suppliers?search=TechLogix`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataSearch = await resSearch.json();

    assert(
      resSearch.status === 200 &&
        dataSearch.data.length === 1 &&
        dataSearch.data[0].supplier_name.includes('TechLogix'),
      'GET /suppliers?search=TechLogix accurately filters suppliers'
    );

    // 8. GET /api/suppliers/:id - Individual supplier retrieval
    const resGetSingle = await fetch(`${BASE_URL}/suppliers/${supplierA1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataGetSingle = await resGetSingle.json();

    assert(
      resGetSingle.status === 200 &&
        dataGetSingle.data?.id === supplierA1Id &&
        dataGetSingle.data?.supplier_name === 'TechLogix Global Solutions',
      'GET /suppliers/:id retrieves individual supplier with details'
    );

    // 9. PUT /api/suppliers/:id - Update supplier details
    const resUpdate = await fetch(`${BASE_URL}/suppliers/${supplierA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        phone: '+1 (555) 999-0000',
        notes: 'Updated terms: Net 45. 2% early payment discount.'
      })
    });
    const dataUpdate = await resUpdate.json();

    assert(
      resUpdate.status === 200 &&
        dataUpdate.data?.phone === '+1 (555) 999-0000' &&
        dataUpdate.data?.notes.includes('Net 45'),
      'PUT /suppliers/:id successfully updates supplier contact and notes'
    );

    // 10. Create Product for Tenant A (to use in purchase order)
    const resProd = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'USB-C Docking Station',
        sku: `DOCK-${timestamp}`,
        quantity_on_hand: 10,
        cost_price: 45.0,
        selling_price: 89.99
      })
    });
    const dataProd = await resProd.json();
    productAId = dataProd.data?.id;

    assert(resProd.status === 201 && Boolean(productAId), 'Created catalog product for Purchase Order test');

    // 11. POST /api/purchase-orders with supplier selection
    const resCreatePo = await fetch(`${BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        supplier_id: supplierA1Id,
        po_number: `PO-SUPP-${timestamp.toString().slice(-4)}`,
        order_date: '2026-11-16',
        expected_delivery_date: '2026-11-25',
        notes: 'Order placed with TechLogix for Q4 replenishment',
        items: [
          {
            product_id: productAId,
            quantity: 50,
            unit_cost: 42.50
          }
        ]
      })
    });
    const dataCreatePo = await resCreatePo.json();
    poAId = dataCreatePo.data?.id;

    assert(
      resCreatePo.status === 201 &&
        dataCreatePo.success === true &&
        dataCreatePo.data?.supplier_id === supplierA1Id &&
        dataCreatePo.data?.supplier?.supplier_name === 'TechLogix Global Solutions' &&
        parseFloat(dataCreatePo.data?.total_amount) === 2125.00,
      'POST /purchase-orders creates purchase order with selected supplier and items'
    );

    // 12. GET /api/suppliers/:id now reflects the linked purchase order
    const resCheckLinkedPo = await fetch(`${BASE_URL}/suppliers/${supplierA1Id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataCheckLinkedPo = await resCheckLinkedPo.json();

    assert(
      resCheckLinkedPo.status === 200 &&
        Array.isArray(dataCheckLinkedPo.data?.purchase_orders) &&
        dataCheckLinkedPo.data?.purchase_orders.length >= 1,
      'GET /suppliers/:id includes linked purchase orders list'
    );

    // 13. DELETE /api/suppliers/:id - Supplier with linked PO cannot be deleted
    const resDelBlocked = await fetch(`${BASE_URL}/suppliers/${supplierA1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataDelBlocked = await resDelBlocked.json();

    assert(
      resDelBlocked.status === 400 &&
        dataDelBlocked.success === false &&
        dataDelBlocked.message.includes('associated purchase order'),
      'DELETE /suppliers/:id blocks deletion of supplier with active purchase orders'
    );

    // 14. DELETE /api/suppliers/:id - Supplier without PO can be deleted
    const resDelOk = await fetch(`${BASE_URL}/suppliers/${supplierA2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dataDelOk = await resDelOk.json();

    assert(
      resDelOk.status === 200 && dataDelOk.success === true,
      'DELETE /suppliers/:id deletes unlinked supplier successfully'
    );

    // 15. MULTI-TENANCY: Tenant B cannot access Tenant A's supplier by ID
    const resCrossGet = await fetch(`${BASE_URL}/suppliers/${supplierA1Id}`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(
      resCrossGet.status === 404,
      'Tenant B cannot access Tenant A supplier by ID (returns 404 Not Found)'
    );

    // 16. MULTI-TENANCY: Tenant B cannot update Tenant A's supplier
    const resCrossPut = await fetch(`${BASE_URL}/suppliers/${supplierA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({ supplier_name: 'Hacked Supplier' })
    });
    assert(
      resCrossPut.status === 404,
      'Tenant B cannot update Tenant A supplier (returns 404 Not Found)'
    );

    // 17. MULTI-TENANCY: Tenant B cannot create purchase order using Tenant A's supplier
    const resCrossPo = await fetch(`${BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        supplier_id: supplierA1Id,
        items: [{ product_id: productAId, quantity: 5 }]
      })
    });
    assert(
      resCrossPo.status === 404,
      "Tenant B cannot use Tenant A's supplier in Purchase Order (returns 404 Not Found)"
    );

    // 18. MULTI-TENANCY: Tenant B supplier list is completely isolated
    const resListB = await fetch(`${BASE_URL}/suppliers`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dataListB = await resListB.json();

    assert(
      resListB.status === 200 && dataListB.data.length === 0,
      "Tenant B's suppliers list contains 0 items from Tenant A"
    );

  } catch (err) {
    console.error('Test suite runtime error:', err);
  } finally {
    console.log('\n====================================================');
    console.log(`Supplier Test Results: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runSupplierSuite();
