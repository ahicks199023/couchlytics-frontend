'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/config';

interface Trade {
  id: number;
  team_a_id: number;
  team_b_id: number;
  team_a_name: string;
  team_b_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  trade_value_a: number;
  trade_value_b: number;
  players_involved: number;
  draft_picks_involved: number;
}

export default function CommissionerTradesPage() {
  const params = useParams();
  const leagueId = params.leagueId;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch(`${API_BASE}/leagues/${leagueId}/commissioner/trades`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTrades(data.trades);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trades');
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchTrades();
    }
  }, [leagueId]);

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true;
    return trade.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-900 text-yellow-200';
      case 'approved': return 'bg-green-900 text-green-200';
      case 'rejected': return 'bg-red-900 text-red-200';
      case 'completed': return 'bg-blue-900 text-blue-200';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Navigation */}
      <div className="mb-6">
        <Link 
          href={`/leagues/${leagueId}/commissioner`}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
        >
          ← Back to Commissioner Hub
        </Link>
        <h1 className="text-2xl font-bold text-white">Trade Management</h1>
        <p className="text-gray-400 mt-2">Oversee and manage league trades</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab === 'all' ? 'All Trades' : getStatusText(tab)}
                <span className="ml-2 bg-gray-700 text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {trades.filter(t => tab === 'all' || t.status === tab).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Trades List */}
      <div className="space-y-4">
        {filteredTrades.map((trade) => (
          <div key={trade.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{trade.team_a_name}</div>
                    <div className="text-sm text-gray-400">Team A</div>
                  </div>
                  <div className="text-2xl text-gray-500">↔</div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{trade.team_b_name}</div>
                    <div className="text-sm text-gray-400">Team B</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(trade.status)}`}>
                  {getStatusText(trade.status)}
                </span>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(trade.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{trade.trade_value_a}</div>
                <div className="text-xs text-gray-400">Team A Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{trade.trade_value_b}</div>
                <div className="text-xs text-gray-400">Team B Value</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">{trade.players_involved}</div>
                <div className="text-xs text-gray-400">Players</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">{trade.draft_picks_involved}</div>
                <div className="text-xs text-gray-400">Draft Picks</div>
              </div>
            </div>

            {trade.status === 'pending' && (
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                  Approve Trade
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                  Reject Trade
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                  View Details
                </button>
              </div>
            )}

            {trade.status !== 'pending' && (
              <div className="flex gap-2 pt-4 border-t border-gray-700">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                  View Details
                </button>
                <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
                  Trade History
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {filter === 'all' ? 'No trades found' : `No ${filter} trades found`}
            </div>
            <p className="text-gray-500 mt-2">
              {filter === 'all' 
                ? 'Trades will appear here once they are created'
                : `No trades are currently ${filter}`
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Trade Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{trades.length}</div>
            <div className="text-sm text-gray-400">Total Trades</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {trades.filter(t => t.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-400">Pending Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {trades.filter(t => t.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-400">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {trades.filter(t => t.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-400">Rejected</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
          Export Trade Data
        </button>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
          Trade Rules
        </button>
        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
          Trade History
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Trade management data is fetched from the league commissioner API
      </div>
    </div>
  );
}
