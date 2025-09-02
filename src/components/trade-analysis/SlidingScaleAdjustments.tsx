'use client'

import React from 'react'

interface SlidingScaleAdjustment {
  position: string
  player_name: string
  grade_improvement: string
  adjustment_percentage: number
  base_value: number
  adjusted_value: number
  value_increase: number
}

interface SlidingScaleAdjustments {
  total_adjustments: number
  total_value_increase: number
  adjustments_applied: SlidingScaleAdjustment[]
}

interface SlidingScaleAdjustmentsProps {
  slidingScaleAdjustments: SlidingScaleAdjustments
}

const SlidingScaleAdjustments: React.FC<SlidingScaleAdjustmentsProps> = ({ slidingScaleAdjustments }) => {
  if (slidingScaleAdjustments.total_adjustments === 0) {
    return (
      <div className="sliding-scale bg-gray-800/30 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">⚖️ Sliding Scale Adjustments</h3>
        <div className="text-gray-400 text-center py-4">
          No grade improvements detected - no sliding scale adjustments applied
        </div>
      </div>
    )
  }

  return (
    <div className="sliding-scale bg-gray-800/30 p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4">⚖️ Sliding Scale Adjustments</h3>
      
      {/* Summary */}
      <div className="adjustment-summary bg-blue-900/20 border border-blue-500 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-300">
              {slidingScaleAdjustments.total_adjustments}
            </div>
            <div className="text-sm text-gray-400">Adjustments Applied</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-300">
              +{slidingScaleAdjustments.total_value_increase.toFixed(1)}
            </div>
            <div className="text-sm text-gray-400">Total Value Increase</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-300">
              {((slidingScaleAdjustments.total_value_increase / 100) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">Average Increase</div>
          </div>
        </div>
      </div>

      {/* Individual Adjustments */}
      <div className="adjustments-list">
        <h4 className="text-md font-semibold mb-3">Individual Adjustments</h4>
        <div className="space-y-3">
          {slidingScaleAdjustments.adjustments_applied.map((adjustment, index) => (
            <div key={index} className="bg-purple-900/20 border border-purple-500 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{adjustment.player_name}</span>
                  <span className="text-sm text-gray-400">({adjustment.position})</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-purple-300">
                    +{adjustment.adjustment_percentage}%
                  </div>
                  <div className="text-sm text-gray-400">
                    {adjustment.grade_improvement}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Base Value</div>
                  <div className="font-mono">{adjustment.base_value.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Adjusted Value</div>
                  <div className="font-mono text-green-300">{adjustment.adjusted_value.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Increase</div>
                  <div className="font-mono text-purple-300">+{adjustment.value_increase.toFixed(1)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SlidingScaleAdjustments
