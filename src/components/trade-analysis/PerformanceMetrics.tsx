'use client'

import React from 'react'

interface PerformanceMetricsProps {
  metrics?: {
    analysisTime: number
    optimizationsUsed: string[]
    cacheHit: boolean
  }
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  if (!metrics) return null
  
  return (
    <div className="performance-metrics bg-green-900/20 border border-green-500 p-3 rounded-lg mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">⚡</span>
          <span className="text-sm font-medium text-green-300">
            Analysis completed in {metrics.analysisTime}s
          </span>
        </div>
        <div className="text-xs text-green-400">
          Optimized Performance
        </div>
      </div>
      <div className="mt-2 text-xs text-green-300">
        Optimizations: {metrics.optimizationsUsed?.join(', ') || 'Standard optimizations'}
        {metrics.cacheHit && <span className="ml-2 text-blue-300">• Cache Hit</span>}
      </div>
    </div>
  )
}

export default PerformanceMetrics
