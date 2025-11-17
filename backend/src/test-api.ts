import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  data?: any;
}

async function testAPI() {
  const results: TestResult[] = [];
  let authToken = '';

  console.log('🧪 Testing API endpoints...\n');

  // Test 1: Health check
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    results.push({
      name: 'Health Check',
      passed: response.ok && data.status === 'ok',
      data,
    });
    console.log('✅ Health check passed');
  } catch (error: any) {
    results.push({
      name: 'Health Check',
      passed: false,
      error: error.message,
    });
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Login as admin
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0812345678',
        password: 'admin123',
      }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      authToken = data.token;
      results.push({
        name: 'Login (Admin)',
        passed: true,
        data: { user: data.user.name, role: data.user.role },
      });
      console.log('✅ Login (Admin) passed');
    } else {
      results.push({
        name: 'Login (Admin)',
        passed: false,
        error: data.error || 'Login failed',
      });
      console.log('❌ Login (Admin) failed:', data.error);
    }
  } catch (error: any) {
    results.push({
      name: 'Login (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Login (Admin) failed:', error.message);
  }

  if (!authToken) {
    console.log('\n⚠️  Cannot continue tests without authentication token');
    printResults(results);
    process.exit(1);
  }

  // Test 3: Get users (admin)
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Users (Admin)',
      passed: response.ok && Array.isArray(data),
      data: { count: Array.isArray(data) ? data.length : 0 },
    });
    console.log('✅ Get Users (Admin) passed');
  } catch (error: any) {
    results.push({
      name: 'Get Users (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Users (Admin) failed:', error.message);
  }

  // Test 4: Get assets (admin)
  try {
    const response = await fetch(`${API_URL}/api/assets`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Assets (Admin)',
      passed: response.ok && Array.isArray(data),
      data: { count: Array.isArray(data) ? data.length : 0 },
    });
    console.log('✅ Get Assets (Admin) passed');
  } catch (error: any) {
    results.push({
      name: 'Get Assets (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Assets (Admin) failed:', error.message);
  }

  // Test 5: Get contracts (admin)
  try {
    const response = await fetch(`${API_URL}/api/contracts`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Contracts (Admin)',
      passed: response.ok && Array.isArray(data),
      data: { count: Array.isArray(data) ? data.length : 0 },
    });
    console.log('✅ Get Contracts (Admin) passed');
  } catch (error: any) {
    results.push({
      name: 'Get Contracts (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Contracts (Admin) failed:', error.message);
  }

  // Test 6: Get payments (admin)
  try {
    const response = await fetch(`${API_URL}/api/payments`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Payments (Admin)',
      passed: response.ok && Array.isArray(data),
      data: { count: Array.isArray(data) ? data.length : 0 },
    });
    console.log('✅ Get Payments (Admin) passed');
  } catch (error: any) {
    results.push({
      name: 'Get Payments (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Payments (Admin) failed:', error.message);
  }

  // Test 7: Get maintenance (admin)
  try {
    const response = await fetch(`${API_URL}/api/maintenance`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Maintenance (Admin)',
      passed: response.ok && Array.isArray(data),
      data: { count: Array.isArray(data) ? data.length : 0 },
    });
    console.log('✅ Get Maintenance (Admin) passed');
  } catch (error: any) {
    results.push({
      name: 'Get Maintenance (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Maintenance (Admin) failed:', error.message);
  }

  // Test 8: Get dashboard stats (admin)
  try {
    const response = await fetch(`${API_URL}/api/dashboard`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Dashboard Stats (Admin)',
      passed: response.ok && typeof data === 'object',
      data,
    });
    console.log('✅ Get Dashboard Stats (Admin) passed');
  } catch (error: any) {
    results.push({
      name: 'Get Dashboard Stats (Admin)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Dashboard Stats (Admin) failed:', error.message);
  }

  // Test 9: Get admin summary
  try {
    const response = await fetch(`${API_URL}/api/admin/summary`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    const data = await response.json();
    results.push({
      name: 'Get Admin Summary',
      passed: response.ok && typeof data === 'object',
      data,
    });
    console.log('✅ Get Admin Summary passed');
  } catch (error: any) {
    results.push({
      name: 'Get Admin Summary',
      passed: false,
      error: error.message,
    });
    console.log('❌ Get Admin Summary failed:', error.message);
  }

  // Test 10: Login as owner
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0823456789',
        password: 'owner123',
      }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      const ownerToken = data.token;
      // Test owner can only see their assets
      const assetsResponse = await fetch(`${API_URL}/api/assets`, {
        headers: {
          'Authorization': `Bearer ${ownerToken}`,
        },
      });
      const assetsData = await assetsResponse.json();
      results.push({
        name: 'Login & Get Assets (Owner)',
        passed: assetsResponse.ok && Array.isArray(assetsData),
        data: { count: Array.isArray(assetsData) ? assetsData.length : 0 },
      });
      console.log('✅ Login & Get Assets (Owner) passed');
    } else {
      results.push({
        name: 'Login & Get Assets (Owner)',
        passed: false,
        error: data.error || 'Login failed',
      });
      console.log('❌ Login & Get Assets (Owner) failed:', data.error);
    }
  } catch (error: any) {
    results.push({
      name: 'Login & Get Assets (Owner)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Login & Get Assets (Owner) failed:', error.message);
  }

  // Test 11: Login as tenant
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '0834567890',
        password: 'tenant123',
      }),
    });
    const data = await response.json();
    if (response.ok && data.token) {
      const tenantToken = data.token;
      // Test tenant can only see their contracts
      const contractsResponse = await fetch(`${API_URL}/api/contracts`, {
        headers: {
          'Authorization': `Bearer ${tenantToken}`,
        },
      });
      const contractsData = await contractsResponse.json();
      results.push({
        name: 'Login & Get Contracts (Tenant)',
        passed: contractsResponse.ok && Array.isArray(contractsData),
        data: { count: Array.isArray(contractsData) ? contractsData.length : 0 },
      });
      console.log('✅ Login & Get Contracts (Tenant) passed');
    } else {
      results.push({
        name: 'Login & Get Contracts (Tenant)',
        passed: false,
        error: data.error || 'Login failed',
      });
      console.log('❌ Login & Get Contracts (Tenant) failed:', data.error);
    }
  } catch (error: any) {
    results.push({
      name: 'Login & Get Contracts (Tenant)',
      passed: false,
      error: error.message,
    });
    console.log('❌ Login & Get Contracts (Tenant) failed:', error.message);
  }

  printResults(results);
}

function printResults(results: TestResult[]) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.name}`);
    if (result.data) {
      console.log(`   Data: ${JSON.stringify(result.data)}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  }
}

testAPI();

