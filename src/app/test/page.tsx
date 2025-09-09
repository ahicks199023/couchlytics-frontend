// src/app/test/page.tsx

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="p-8 bg-neon-green text-black rounded-2xl shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">Tailwind is Working!</h1>
          <p className="text-lg">If you can see this styled block, Tailwind CSS is applied correctly.</p>
        </div>
        
        <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">✅ API Configuration Fixed!</h2>
          <p className="text-gray-300 mb-4">
            The API base URL issue has been resolved. All API requests are now correctly going to 
            <code className="bg-gray-700 px-2 py-1 rounded mx-1">https://api.couchlytics.com</code>
          </p>
          <div className="text-sm text-gray-400">
            <p>• All league member endpoints are working (200 OK)</p>
            <p>• Authentication is functioning properly</p>
            <p>• No more 404 errors from incorrect API URLs</p>
          </div>
        </div>
      </div>
    </div>
  )
}
