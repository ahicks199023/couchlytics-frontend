'use client';

import Login from '../../components/Login'; // ← OR use relative path if aliases aren’t set up

export default function LoginPage() {
  // DEBUG: This should show immediately when the page loads
  if (typeof window !== 'undefined') {
    alert('🚨 LOGIN PAGE LOADED - DEBUG-v3');
    console.log('🚨🚨🚨 LOGIN PAGE COMPONENT LOADED 🚨🚨🚨');
  }
  
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Login />
    </main>
  );
}
