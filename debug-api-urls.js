#!/usr/bin/env node

/**
 * Debug script to check API URL configuration
 * Run with: node debug-api-urls.js
 */

console.log('🔍 Couchlytics API URL Debug Script');
console.log('=====================================\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_API_BASE:', process.env.NEXT_PUBLIC_API_BASE || 'Not set');
console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL || 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('');

// Simulate the config logic
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 
                 process.env.NEXT_PUBLIC_API_BASE_URL || 
                 'https://api.couchlytics.com';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com';

console.log('🔧 Configuration Values:');
console.log('API_BASE:', API_BASE);
console.log('API_BASE_URL:', API_BASE_URL);
console.log('');

// Check if URLs are correct
const expectedUrl = 'https://api.couchlytics.com';
const isCorrect = API_BASE === expectedUrl && API_BASE_URL === expectedUrl;

console.log('✅ Status Check:');
console.log('Expected URL:', expectedUrl);
console.log('API_BASE correct:', API_BASE === expectedUrl ? '✅' : '❌');
console.log('API_BASE_URL correct:', API_BASE_URL === expectedUrl ? '✅' : '❌');
console.log('Overall status:', isCorrect ? '✅ All good!' : '❌ Issues found');
console.log('');

// Test API endpoints
console.log('🧪 Test API Endpoints:');
const testEndpoints = [
  '/auth/status',
  '/leagues/12335716/members/me',
  '/leagues/12335716/members'
];

testEndpoints.forEach(endpoint => {
  const fullUrl = `${API_BASE}${endpoint}`;
  console.log(`  ${endpoint} → ${fullUrl}`);
});

console.log('');
console.log('💡 If you see issues:');
console.log('1. Check Vercel environment variables');
console.log('2. Clear browser cache');
console.log('3. Redeploy the application');
console.log('4. Check for hardcoded URLs in source code');
