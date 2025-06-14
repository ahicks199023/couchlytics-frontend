'use client'

export default function ImportHelpPage() {
  return (
    <main className="p-6 text-white min-h-screen bg-black">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Sync Your League</h1>

        <p className="text-gray-400">
          Couch Commish supports direct syncing from the Madden Companion App via the new <strong>Export League Data</strong> feature.
        </p>

        <h2 className="text-xl font-semibold mt-4">Option 1: Automatic Sync (Recommended)</h2>
        <ol className="list-decimal ml-6 space-y-2 text-gray-300">
          <li>Open the Madden Companion App</li>
          <li>Select your Franchise</li>
          <li>Go to <strong>League Settings</strong> and choose <strong>Export League Data</strong></li>
          <li>Paste this URL:
            <pre className="bg-gray-800 text-green-400 px-4 py-2 mt-2 rounded text-sm">
              https://couchlytics.com/api/companion-hook?leagueId=your-league-name
            </pre>
          </li>
          <li>Tap <strong>Export</strong> — your league data will be synced automatically!</li>
        </ol>

        <h2 className="text-xl font-semibold mt-4">Option 2: Manual Upload</h2>
        <p className="text-gray-400">
          If you can&apos;t use the export option, you can manually upload your league data as a JSON file on the{' '}
          <a href="/upload" className="underline text-white hover:text-blue-400">Upload Page</a>.
        </p>
      </div>
    </main>
  )
}
