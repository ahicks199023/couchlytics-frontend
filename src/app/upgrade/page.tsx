'use client'

import Link from 'next/link'

export default function UpgradePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-800 text-white px-6 py-16 flex flex-col items-center text-center">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">Go Premium with Couchlytics+</h1>
      <p className="text-lg text-gray-300 max-w-2xl mb-10">
        Unlock the full GM Toolkit, advanced stats breakdowns, and exclusive league insights. Built for serious commissioners and elite franchise GMs.
      </p>

      {/* Pricing Box */}
      <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-2">Couchlytics+</h2>
        <p className="text-4xl font-bold mb-4">$5<span className="text-lg font-normal"> / month</span></p>
        <ul className="text-left text-sm text-gray-300 mb-6 space-y-2">
          <li>✅ Full access to GM Toolkit</li>
          <li>✅ Draft Assistant with sleeper picks</li>
          <li>✅ Trade Evaluator + ROI Analysis</li>
          <li>✅ Cap Space + Free Agent Tools</li>
          <li>✅ Priority support + feature requests</li>
        </ul>

        <a
          href="https://buy.stripe.com/test_4gwcOAfgn4RvbHaaEE" // 🔁 Replace with your actual Stripe link
          className="block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded text-lg transition"
        >
          Upgrade Now
        </a>
      </div>

      <Link href="/dashboard" className="text-sm text-gray-400 underline hover:text-white transition">
        Back to Dashboard
      </Link>
    </main>
  )
}
