'use client'

import React from 'react'

interface PlayerItemization {
  name: string
  position: string
  ovr: number
  base_value: number
  enhanced_value: number
  adjustment: number
  adjustment_reason: string
  calculation_method: string
}

interface ItemizationSummary {
  total_base_value_out: number
  total_enhanced_value_out: number
  total_base_value_in: number
  total_enhanced_value_in: number
  net_value_change: number
}

interface ItemizationBreakdown {
  players_out: PlayerItemization[]
  players_in: PlayerItemization[]
  summary: ItemizationSummary
}

interface ItemizationBreakdownProps {
  itemizationBreakdown: ItemizationBreakdown
}

const ItemizationBreakdown: React.FC<ItemizationBreakdownProps> = ({ itemizationBreakdown }) => {
  return (
    <div className="itemization-breakdown bg-gray-800/30 p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4">📋 Itemization Breakdown</h3>
      
      {/* Summary */}
      <div className="breakdown-summary bg-gray-700/50 p-4 rounded-lg mb-6">
        <h4 className="text-md font-semibold mb-3">Value Summary</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Value Out:</span>
              <span className="font-mono">{itemizationBreakdown.summary.total_base_value_out.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Enhanced Value Out:</span>
              <span className="font-mono">{itemizationBreakdown.summary.total_enhanced_value_out.toFixed(1)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Base Value In:</span>
              <span className="font-mono">{itemizationBreakdown.summary.total_base_value_in.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Enhanced Value In:</span>
              <span className="font-mono text-green-300">{itemizationBreakdown.summary.total_enhanced_value_in.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-600 pt-2 mt-3">
          <div className="flex justify-between">
            <span className="font-medium">Net Value Change:</span>
            <span className={`font-mono font-bold ${
              itemizationBreakdown.summary.net_value_change >= 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {itemizationBreakdown.summary.net_value_change >= 0 ? '+' : ''}
              {itemizationBreakdown.summary.net_value_change.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Players Out */}
      {itemizationBreakdown.players_out.length > 0 && (
        <div className="players-out mb-6">
          <h4 className="text-md font-semibold text-red-300 mb-3">📤 Players Being Traded Out</h4>
          <div className="space-y-3">
            {itemizationBreakdown.players_out.map((player, index) => (
              <div key={index} className="bg-red-900/20 border border-red-500 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm text-gray-400 ml-2">
                      {player.position} • {player.ovr} OVR
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg">{player.enhanced_value.toFixed(1)}</div>
                    <div className="text-sm text-gray-400">Final Value</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Base Value</div>
                    <div className="font-mono">{player.base_value.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Adjustment</div>
                    <div className={`font-mono ${player.adjustment >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {player.adjustment >= 0 ? '+' : ''}{player.adjustment.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Reason</div>
                    <div className="text-xs text-gray-300">{player.adjustment_reason}</div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  <strong>Calculation:</strong> {player.calculation_method}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Players In */}
      {itemizationBreakdown.players_in.length > 0 && (
        <div className="players-in">
          <h4 className="text-md font-semibold text-green-300 mb-3">📥 Players Being Received</h4>
          <div className="space-y-3">
            {itemizationBreakdown.players_in.map((player, index) => (
              <div key={index} className="bg-green-900/20 border border-green-500 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium">{player.name}</span>
                    <span className="text-sm text-gray-400 ml-2">
                      {player.position} • {player.ovr} OVR
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg text-green-300">{player.enhanced_value.toFixed(1)}</div>
                    <div className="text-sm text-gray-400">Final Value</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Base Value</div>
                    <div className="font-mono">{player.base_value.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Adjustment</div>
                    <div className={`font-mono ${player.adjustment >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {player.adjustment >= 0 ? '+' : ''}{player.adjustment.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Reason</div>
                    <div className="text-xs text-gray-300">{player.adjustment_reason}</div>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  <strong>Calculation:</strong> {player.calculation_method}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ItemizationBreakdown
