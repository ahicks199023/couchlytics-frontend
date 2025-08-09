'use client'

import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the chat demo component with no SSR
const ChatDemoComponent = dynamicImport(() => import('@/components/ChatDemoComponent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-4">🚀</div>
        <div className="text-lg">Loading Enhanced Chat Demo...</div>
        <div className="text-sm text-gray-400 mt-2">Please wait while we initialize the chat system</div>
      </div>
    </div>
  )
})

export default function ChatDemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">🚀</div>
          <div className="text-lg">Loading Enhanced Chat Demo...</div>
          <div className="text-sm text-gray-400 mt-2">Please wait while we initialize the chat system</div>
        </div>
      </div>
    }>
      <ChatDemoComponent />
    </Suspense>
  )
}

// Force dynamic rendering to prevent build-time errors
export const dynamic = 'force-dynamic'