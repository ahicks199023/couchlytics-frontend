'use client';

import { useState } from 'react';

interface TestResult {
  step: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  debug?: Record<string, unknown>;
}

export default function TestMembersEndpointPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const addResult = (step: string, success: boolean, data?: Record<string, unknown>, error?: string, debug?: Record<string, unknown>) => {
    setResults(prev => [...prev, { step, success, data, error, debug }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testAuthFlow = async () => {
    setIsLoading(true);
    clearResults();

    try {
      // Step 1: Login
      addResult('Starting Authentication Test', true);
      
      const loginResponse = await fetch('https://api.couchlytics.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        addResult('Login', true, loginData);
      } else {
        const errorData = await loginResponse.text();
        addResult('Login', false, undefined, errorData);
        setIsLoading(false);
        return;
      }

      // Step 2: Check Auth Status
      const authResponse = await fetch('https://api.couchlytics.com/auth/status', {
        credentials: 'include'
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        addResult('Auth Status Check', true, authData);
      } else {
        addResult('Auth Status Check', false, undefined, 'Not authenticated');
        setIsLoading(false);
        return;
      }

      // Step 3: Test Members Endpoint
      const membersResponse = await fetch('https://api.couchlytics.com/leagues/12335716/members', {
        credentials: 'include'
      });

      const membersData = await membersResponse.json();
      
      if (membersResponse.ok) {
        addResult('Members Endpoint', true, membersData, undefined, {
          status: membersResponse.status,
          memberCount: membersData.total || membersData.members?.length
        });
      } else {
        addResult('Members Endpoint', false, membersData, `HTTP ${membersResponse.status}`, membersData.debug);
      }

    } catch (error) {
      addResult('Test Failed', false, undefined, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const testWithCurl = () => {
    const curlCommands = `
# 1. Login first
curl -X POST "https://api.couchlytics.com/auth/login" \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"email":"${credentials.email}","password":"${credentials.password}"}'

# 2. Test members endpoint
curl -X GET "https://api.couchlytics.com/leagues/12335716/members" \\
  -b cookies.txt \\
  -H "Content-Type: application/json"
    `;
    
    navigator.clipboard.writeText(curlCommands);
    alert('Curl commands copied to clipboard!');
  };

  const testJavaScript = () => {
    const jsCode = `
// Complete test function
async function testMembersEndpoint() {
  try {
    // Login
    const loginResponse = await fetch('https://api.couchlytics.com/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: '${credentials.email}',
        password: '${credentials.password}'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }
    
    // Test members endpoint
    const membersResponse = await fetch('https://api.couchlytics.com/leagues/12335716/members', {
      credentials: 'include'
    });
    
    const data = await membersResponse.json();
    console.log('Response:', data);
    
    if (membersResponse.ok) {
      console.log('✅ Success! Members:', data.members?.length || 0);
    } else {
      console.log('❌ Error:', data.error);
      if (data.debug) {
        console.log('🔍 Debug info:', data.debug);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMembersEndpoint();
    `;
    
    navigator.clipboard.writeText(jsCode);
    alert('JavaScript test code copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔧 Frontend Members Endpoint Testing
        </h1>

        {/* Credentials Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="password"
              />
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testAuthFlow}
              disabled={isLoading || !credentials.email || !credentials.password}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Testing...' : '🧪 Run Complete Test'}
            </button>
            
            <button
              onClick={clearResults}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              🗑️ Clear Results
            </button>
            
            <button
              onClick={testWithCurl}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
            >
              📋 Copy cURL Commands
            </button>
            
            <button
              onClick={testJavaScript}
              className="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700"
            >
              📋 Copy JavaScript Code
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {results.length === 0 ? (
            <p className="text-gray-500 italic">No test results yet. Click &quot;Run Complete Test&quot; to start.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.success 
                      ? 'bg-green-50 border-green-500' 
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {result.success ? '✅' : '❌'} {result.step}
                    </h3>
                    <span className={`text-sm px-2 py-1 rounded ${
                      result.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600 font-medium">Error:</p>
                      <p className="text-sm text-red-600">{result.error}</p>
                    </div>
                  )}
                  
                  {result.debug && (
                    <div className="mt-2">
                      <p className="text-sm text-blue-600 font-medium">Debug Info:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(result.debug, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.data && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 font-medium">Response Data:</p>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expected Results Reference */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Expected Results Reference</h2>
          
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">✅ Success Case (200 OK)</h3>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`{
  "success": true,
  "members": [
    {
      "id": 1,
      "user_id": 1,
      "league_id": "12335716",
      "role": "commissioner",
      "joined_at": "2025-01-01T00:00:00Z",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "display_name": "User Name"
      }
    }
  ],
  "total": 1
}`}
              </pre>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">❌ Error Cases</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">401 Unauthorized (Not Logged In)</p>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`{
  "code": "AUTH_REQUIRED",
  "error": "Authentication required"
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-sm font-medium">403 Forbidden (Not a Member)</p>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`{
  "success": false,
  "error": "Unauthorized",
  "debug": {
    "user_id": 1,
    "league_id": 12335716,
    "user_leagues": ["other_league_id"],
    "league_member_user_ids": [2, 3]
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
