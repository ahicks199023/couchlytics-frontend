'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatDemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new production chat page
    router.replace('/chat')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">🚀</div>
        <div className="text-lg">Redirecting to Chat...</div>
        <div className="text-sm text-gray-400 mt-2">Please wait while we redirect you to the new chat system</div>
      </div>
    </div>
  )
}