'use client'

import React, { useState, useEffect } from 'react'
import { fetchTradesHistory, cancelTrade, Trade, Pagination } from '@/lib/trades'

interface TradesHistoryProps {
  leagueId: string
}

const TradesHistory: React.FC<TradesHistoryProps> = ({ leagueId }) => {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filters, setFilters] = useState({ status: 'all', page: 1 })

  useEffect(() => {
    loadTrades()
  }, [leagueId, filters])

  const loadTrades = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchTradesHistory(leagueId, filters)
      setTrades(data.trades)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trades')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to cancel this trade?')) {
      return
    }

    try {
      await cancelTrade(tradeId)
      loadTrades() // Refresh list
    } catch (err) {
      console.error('Failed to cancel trade:', err)
      alert('Failed to cancel trade. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
        <span className="ml-2 text-gray-600">Loading trades...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={loadTrades}
          className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Trades History</h1>
        
        <div className="flex gap-4 items-center">
          <select 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neon-green"
          >
            <option value="all">All Trades</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button 
            onClick={loadTrades}
            className="bg-neon-green text-black px-4 py-2 rounded hover:bg-green-400"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {trades.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No trades found</div>
            <div className="text-gray-500 text-sm mt-2">
              {filters.status === 'all' 
                ? 'No trades have been submitted yet.' 
                : `No ${filters.status} trades found.`
              }
            </div>
          </div>
        ) : (
          trades.map(trade => (
            <div key={trade.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    trade.status === 'pending' ? 'bg-yellow-900 text-yellow-200' :
                    trade.status === 'approved' ? 'bg-green-900 text-green-200' :
                    trade.status === 'denied' ? 'bg-red-900 text-red-200' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {trade.status}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {new Date(trade.created_at).toLocaleDateString()} at{' '}
                    {new Date(trade.created_at).toLocaleTimeString()}
                  </span>
                </div>
                
                {trade.status === 'pending' && (
                  <button 
                    onClick={() => handleCancelTrade(trade.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Cancel Trade
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{trade.team_from.name}</div>
                  <div className="text-sm text-gray-400">Gives</div>
                </div>
                
                <div className="text-2xl text-gray-400">↔</div>
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{trade.team_to.name}</div>
                  <div className="text-sm text-gray-400">Gives</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700 rounded p-4">
                  <h4 className="font-semibold text-white mb-3">{trade.team_from.name} gives:</h4>
                  {trade.team_from_items.length === 0 ? (
                    <div className="text-gray-400 italic">Nothing</div>
                  ) : (
                    <div className="space-y-2">
                      {trade.team_from_items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                          {item.type === 'player' ? (
                            <span className="text-white">
                              {item.player?.name} ({item.player?.position})
                            </span>
                          ) : (
                            <span className="text-white">
                              Round {item.draft_pick?.round} Pick ({item.draft_pick?.year})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-700 rounded p-4">
                  <h4 className="font-semibold text-white mb-3">{trade.team_to.name} gives:</h4>
                  {trade.team_to_items.length === 0 ? (
                    <div className="text-gray-400 italic">Nothing</div>
                  ) : (
                    <div className="space-y-2">
                      {trade.team_to_items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                          {item.type === 'player' ? (
                            <span className="text-white">
                              {item.player?.name} ({item.player?.position})
                            </span>
                          ) : (
                            <span className="text-white">
                              Round {item.draft_pick?.round} Pick ({item.draft_pick?.year})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {trade.notes && (
                <div className="mt-4 p-3 bg-gray-700 rounded">
                  <div className="text-sm text-gray-400 mb-1">Notes:</div>
                  <div className="text-white">{trade.notes}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            disabled={!pagination.has_prev}
            onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded transition-colors"
          >
            Previous
          </button>
          
          <span className="text-gray-400">
            Page {pagination.page} of {pagination.total_pages}
          </span>
          
          <button 
            disabled={!pagination.has_next}
            onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white px-4 py-2 rounded transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default TradesHistory 