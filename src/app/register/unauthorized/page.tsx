'use client'

import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-500 mb-4">403 - Unauthorized</h1>
        <p className="text-lg text-gray-300 mb-4">
          You don’t have permission to access this page.
        </p>
        <Link href="/dashboard">
          <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </main>
  )
}
