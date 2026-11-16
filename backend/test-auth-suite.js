require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { sequelize, User, Organization, OrganizationSetting } = require('./src/models');

const TEST_PORT = 5001;

async function runTestSuite() {
  console.log('====================================================');
  console.log('        StockFlow Auth & Multi-Tenant Test Suite     ');
  console.log('====================================================\n');

  // Authenticate database
  await sequelize.authenticate();
  console.log('✔ MySQL Database connected successfully.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✔ Test HTTP server listening on http://localhost:${TEST_PORT}\n`);

  const BASE_URL = `http://localhost:${TEST_PORT}/api/auth`;

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

  const testEmail = `admin_${Date.now()}@stockflowtest.com`;
  const testPassword = 'Password123!';
  const orgName = 'Apex Retail Corp';
  let authToken = '';

  try {
    // 1. Validation error: Missing required fields
    const res1 = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data1 = await res1.json();
    assert(
      res1.status === 400 && data1.success === false && Array.isArray(data1.errors),
      'POST /register rejects empty body with 400 and validation errors',
      data1
    );

    // 2. Validation error: Password mismatch
    const res2 = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tester',
        email: testEmail,
        password: testPassword,
        confirmPassword: 'WrongPassword',
        organizationName: orgName
      })
    });
    const data2 = await res2.json();
    assert(
      res2.status === 400 && data2.errors.some((e) => e.message.includes('Passwords do not match')),
      'POST /register validates password confirmation match',
      data2
    );

    // 3. Successful Registration
    const res3 = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        organizationName: orgName
      })
    });
    const data3 = await res3.json();
    authToken = data3.data?.token;

    assert(
      res3.status === 201 &&
        data3.success === true &&
        Boolean(authToken) &&
        data3.data?.organization?.name === orgName &&
        data3.data?.settings?.default_low_stock_threshold === 5 &&
        data3.data?.user?.email === testEmail &&
        data3.data?.user?.password_hash === undefined,
      'POST /register creates organization, settings, user, returns JWT and NEVER exposes password_hash',
      data3
    );

    // 4. Duplicate Registration rejection
    const res4 = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        organizationName: 'Another Org'
      })
    });
    const data4 = await res4.json();
    assert(
      res4.status === 409 && data4.success === false,
      'POST /register prevents duplicate email registration with 409 Conflict',
      data4
    );

    // 5. Login: Invalid email
    const res5 = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@nowhere.com',
        password: testPassword
      })
    });
    const data5 = await res5.json();
    assert(
      res5.status === 401 && data5.success === false,
      'POST /login rejects unregistered email with 401 Unauthorized',
      data5
    );

    // 6. Login: Wrong password
    const res6 = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'IncorrectPassword'
      })
    });
    const data6 = await res6.json();
    assert(
      res6.status === 401 && data6.success === false,
      'POST /login rejects invalid password with 401 Unauthorized',
      data6
    );

    // 7. Login: Successful
    const res7 = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const data7 = await res7.json();
    const loginToken = data7.data?.token;
    assert(
      res7.status === 200 &&
        data7.success === true &&
        Boolean(loginToken) &&
        data7.data?.organization?.name === orgName &&
        data7.data?.user?.email === testEmail &&
        data7.data?.user?.password_hash === undefined,
      'POST /login authenticates credentials, returns JWT with organization info, and NEVER exposes password_hash',
      data7
    );

    // 8. GET /me without token
    const res8 = await fetch(`${BASE_URL}/me`);
    const data8 = await res8.json();
    assert(
      res8.status === 401 && data8.success === false,
      'GET /me rejects unauthenticated request with 401 Unauthorized',
      data8
    );

    // 9. GET /me with malformed / invalid token
    const res9 = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: 'Bearer bogus_token_12345' }
    });
    const data9 = await res9.json();
    assert(
      res9.status === 401 && data9.success === false,
      'GET /me rejects invalid JWT token with 401 Unauthorized',
      data9
    );

    // 10. GET /me with valid JWT token
    const res10 = await fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${loginToken}` }
    });
    const data10 = await res10.json();
    assert(
      res10.status === 200 &&
        data10.success === true &&
        data10.data?.user?.email === testEmail &&
        data10.data?.organization?.name === orgName &&
        data10.data?.settings?.default_low_stock_threshold === 5 &&
        data10.data?.user?.password_hash === undefined,
      'GET /me returns authenticated user, organization, and settings with tenant context',
      data10
    );

  } catch (error) {
    console.error('Unexpected error during test execution:', error);
  } finally {
    server.close();
    console.log('\n====================================================');
    console.log(`Test Results: ${passedTests}/${totalTests} Passed`);
    console.log('====================================================\n');
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

runTestSuite();
