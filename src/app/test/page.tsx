// src/app/test/page.tsx

import ApiDebugPanel from '@/components/ApiDebugPanel'

export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="p-8 bg-neon-green text-black rounded-2xl shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">Tailwind is Working!</h1>
          <p className="text-lg">If you can see this styled block, Tailwind CSS is applied correctly.</p>
        </div>
        
        <ApiDebugPanel />
      </div>
    </div>
  )
}
