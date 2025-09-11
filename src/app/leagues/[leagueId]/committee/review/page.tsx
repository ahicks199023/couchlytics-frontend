'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TradeDetailModal from '@/components/TradeDetailModal';

interface PendingTrade {
  id: number;
  from_user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  to_user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  from_team: {
    id: number;
    name: string;
    city: string;
  };
  to_team: {
    id: number;
    name: string;
    city: string;
  };
  fromPlayers: Array<{
    id: number;
    playerName: string;
    position: string;
    overall_rating: number;
    player_value: number;
  }>;
  toPlayers: Array<{
    id: number;
    playerName: string;
    position: string;
    overall_rating: number;
    player_value: number;
  }>;
  trade_analysis: {
    fairness_score: number;
    recommendation: string;
    analysis: string;
  };
  fairness_score: number;
  created_at: string;
  expires_at: string;
  message: string;
  committee_votes: Array<{
    id: number;
    user_id: number;
    vote: 'approve' | 'reject';
    reasoning: string;
    created_at: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }>;
  votes_summary: {
    approve_count: number;
    reject_count: number;
    total_votes: number;
    votes_needed: number;
  };
}

export default function TradeCommitteeReviewPage() {
  const params = useParams();
  const leagueId = params.leagueId as string;
  const { user } = useAuth();
  
  const [pendingTrades, setPendingTrades] = useState<PendingTrade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<PendingTrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteReasoning, setVoteReasoning] = useState('');

  const fetchPendingTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com';
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/trades/committee/pending`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Pending trades data:', data);
        setPendingTrades(data.trades || []);
      } else if (response.status === 403) {
        setError('You do not have permission to access the trade committee review. Only commissioners, co-commissioners, and trade committee members can view this page.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch pending trades');
      }
    } catch (error) {
      console.error('Error fetching pending trades:', error);
      setError('Failed to load pending trades. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  // Fetch pending trades on component mount
  useEffect(() => {
    if (leagueId) {
      fetchPendingTrades();
    }
  }, [leagueId, fetchPendingTrades]);

  const submitVote = async (tradeId: number, vote: 'approve' | 'reject') => {
    try {
      setVoting(true);
      
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com';
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/committee/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          trade_offer_id: tradeId,
          vote: vote,
          reasoning: voteReasoning
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Vote submitted successfully:', result);
        
        // Refresh the trade data
        await fetchPendingTrades();
        
        // Close modal if decision was made
        if (result.votes_summary?.decision_made) {
          setSelectedTrade(null);
          alert(`Trade ${vote === 'approve' ? 'approved' : 'rejected'} by committee!`);
        } else {
          alert('Vote submitted successfully!');
        }
        
        setVoteReasoning('');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to submit vote:', errorData);
        alert('Failed to submit vote: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Error submitting vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const getFairnessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFairnessLabel = (score: number) => {
    if (score >= 80) return 'Very Fair';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Unfair';
    return 'Very Unfair';
  };

  const getFairnessBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  // Check if user has already voted on a trade
  const hasUserVoted = (trade: PendingTrade) => {
    if (!user) return false;
    return trade.committee_votes.some(vote => vote.user_id === user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading pending trades...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-lg mb-4">⚠️ Access Denied</div>
          <div className="text-gray-300 mb-4">{error}</div>
          <button 
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🏛️ Trade Committee Review
          </h1>
          <p className="text-gray-400">
            Review and vote on pending trades requiring committee approval
          </p>
        </div>

        {pendingTrades.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              🎉 No pending trades requiring committee review
            </div>
            <div className="text-gray-500 text-sm">
              All trades have been processed or no trades are currently awaiting review.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingTrades.map((trade) => (
              <div
                key={trade.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedTrade(trade)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      Trade #{trade.id}
                    </h3>
                    <p className="text-gray-400">
                      {trade.from_team.city} {trade.from_team.name} ↔ {trade.to_team.city} {trade.to_team.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(trade.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getFairnessColor(trade.fairness_score)}`}>
                      {trade.fairness_score}%
                    </div>
                    <div className={`text-sm px-2 py-1 rounded ${getFairnessBgColor(trade.fairness_score)} ${getFairnessColor(trade.fairness_score)}`}>
                      {getFairnessLabel(trade.fairness_score)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">
                      {trade.from_team.city} {trade.from_team.name} Sends:
                    </h4>
                    <div className="space-y-1">
                      {trade.fromPlayers.length > 0 ? (
                        trade.fromPlayers.map((player) => (
                          <div key={player.id} className="text-sm text-gray-300">
                            {player.playerName} ({player.position}) - OVR {player.overall_rating}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No players</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-2">
                      {trade.to_team.city} {trade.to_team.name} Sends:
                    </h4>
                    <div className="space-y-1">
                      {trade.toPlayers.length > 0 ? (
                        trade.toPlayers.map((player) => (
                          <div key={player.id} className="text-sm text-gray-300">
                            {player.playerName} ({player.position}) - OVR {player.overall_rating}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No players</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    {trade.message && (
                      <div className="mb-2">
                        <span className="font-medium">Message:</span> {trade.message}
                      </div>
                    )}
                    {trade.expires_at && (
                      <div>
                        <span className="font-medium">Expires:</span> {new Date(trade.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-green-900 text-green-200 text-xs rounded-full">
                      {trade.votes_summary.approve_count} Approve
                    </span>
                    <span className="px-3 py-1 bg-red-900 text-red-200 text-xs rounded-full">
                      {trade.votes_summary.reject_count} Reject
                    </span>
                    <span className="px-3 py-1 bg-blue-900 text-blue-200 text-xs rounded-full">
                      {trade.votes_summary.total_votes}/{trade.votes_summary.votes_needed} Votes
                    </span>
                    {hasUserVoted(trade) && (
                      <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                        You Voted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trade Detail Modal */}
        {selectedTrade && (
          <TradeDetailModal
            trade={selectedTrade}
            onClose={() => setSelectedTrade(null)}
            onVote={submitVote}
            voting={voting}
            voteReasoning={voteReasoning}
            setVoteReasoning={setVoteReasoning}
            currentUserId={user?.id}
          />
        )}
      </div>
    </div>
  );
}
