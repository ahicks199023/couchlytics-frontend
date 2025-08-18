'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { getPlayerContract, ContractData } from '@/lib/api'

interface PlayerContractProps {
  leagueId: string
  playerId: string
}

export default function PlayerContract({ leagueId, playerId }: PlayerContractProps) {
  const [contractData, setContractData] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContractData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getPlayerContract(leagueId, playerId)
      setContractData(response.contract)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contract data')
    } finally {
      setLoading(false)
    }
  }, [leagueId, playerId])

  useEffect(() => {
    fetchContractData()
  }, [fetchContractData])

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '$0'
    return `$${(amount / 1000000).toFixed(2)}M`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-400">Loading contract information...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchContractData}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!contractData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No contract data available for this player</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Contract Information</h3>
        <div className="text-sm text-gray-400">
          {contractData.yearsLeft} of {contractData.length} years remaining
        </div>
      </div>

      {/* Contract Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Contract Info */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h4 className="text-blue-400 font-semibold mb-4 text-sm uppercase tracking-wide">Contract Details</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300 text-sm">Cap Hit:</span>
              <span className="font-bold text-white">{formatCurrency(contractData.capHit)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300 text-sm">Salary:</span>
              <span className="font-bold text-white">{formatCurrency(contractData.salary)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300 text-sm">Bonus:</span>
              <span className="font-bold text-white">{formatCurrency(contractData.bonus)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300 text-sm">Years Left/Length:</span>
              <span className="font-bold text-white">{contractData.yearsLeft}/{contractData.length}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Release Information */}
        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h4 className="text-blue-400 font-semibold mb-4 text-sm uppercase tracking-wide">Release Information</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300 text-sm">Release Net Savings:</span>
              <span className="font-bold text-green-400">{formatCurrency(contractData.releaseNetSavings)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300 text-sm">Total Release Penalty:</span>
              <span className="font-bold text-red-400">{formatCurrency(contractData.totalReleasePenalty)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300 text-sm">{contractData.penaltyYears.year1.year} Year Penalty:</span>
              <span className="font-bold text-red-400">{formatCurrency(contractData.penaltyYears.year1.penalty)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300 text-sm">{contractData.penaltyYears.year2.year} Year Penalty:</span>
              <span className="font-bold text-red-400">{formatCurrency(contractData.penaltyYears.year2.penalty)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-gray-400 text-xs uppercase tracking-wide">Annual Cap Hit</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(contractData.capHit)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-xs uppercase tracking-wide">Total Contract Value</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(contractData.salary + contractData.bonus)}</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-gray-400 text-xs uppercase tracking-wide">Release Savings</div>
            <div className="text-2xl font-bold text-green-400">{formatCurrency(contractData.releaseNetSavings)}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Contract information dynamically calculated based on current league season
      </div>
    </div>
  )
}
