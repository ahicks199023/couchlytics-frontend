'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TradeDetailModal from '@/components/TradeDetailModal';
import { 
  ArrowRightLeft, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X 
} from 'lucide-react';
import TeamLogo from '@/components/TeamLogo';

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
    devTrait?: string;
  }>;
  toPlayers: Array<{
    id: number;
    playerName: string;
    position: string;
    overall_rating: number;
    player_value: number;
    devTrait?: string;
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
        
        // Debug team data structure
        if (data.trades && data.trades.length > 0) {
          console.log('🔍 First trade team data:', {
            from_team: data.trades[0].from_team,
            to_team: data.trades[0].to_team
          });
        }
        
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
    if (score >= 95) return 'text-green-600 bg-green-50';
    if (score >= 85) return 'text-blue-600 bg-blue-50';
    if (score >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getFairnessLabel = (score: number) => {
    if (score >= 95) return 'Very Fair';
    if (score >= 85) return 'Fair';
    if (score >= 75) return 'Questionable';
    return 'Unfair';
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
                {/* Trade Header with Team Logos */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {/* From Team */}
                    <div className="flex items-center space-x-2">
                      {trade.from_team?.name && trade.from_team.name !== 'Unknown Team' && (
                        <TeamLogo 
                          teamName={trade.from_team.name}
                          size="lg"
                          variant="helmet"
                          className="rounded-full"
                        />
                      )}
                      <span className="font-medium text-white">
                        {trade.from_team?.city && trade.from_team?.name && trade.from_team.name !== 'Unknown Team'
                          ? `${trade.from_team.city} ${trade.from_team.name}` 
                          : trade.from_team?.name && trade.from_team.name !== 'Unknown Team'
                          ? trade.from_team.name
                          : trade.from_team?.city
                          ? trade.from_team.city
                          : 'Team TBD'
                        }
                      </span>
                    </div>
                    
                    {/* Trade Arrow */}
                    <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                    
                    {/* To Team */}
                    <div className="flex items-center space-x-2">
                      {trade.to_team?.name && trade.to_team.name !== 'Unknown Team' && (
                        <TeamLogo 
                          teamName={trade.to_team.name}
                          size="lg"
                          variant="helmet"
                          className="rounded-full"
                        />
                      )}
                      <span className="font-medium text-white">
                        {trade.to_team?.city && trade.to_team?.name && trade.to_team.name !== 'Unknown Team'
                          ? `${trade.to_team.city} ${trade.to_team.name}` 
                          : trade.to_team?.name && trade.to_team.name !== 'Unknown Team'
                          ? trade.to_team.name
                          : trade.to_team?.city
                          ? trade.to_team.city
                          : 'Team TBD'
                        }
                      </span>
                    </div>
                  </div>
                  
                  {/* Trade ID and Status */}
                  <div className="text-right">
                    <h3 className="text-lg font-semibold text-white">
                      Trade #{trade.id}
                    </h3>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getFairnessColor(trade.fairness_score)}`}>
                      {trade.fairness_score}% {getFairnessLabel(trade.fairness_score)}
                    </div>
                  </div>
                </div>

                {/* Trade Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  {/* From Team Players */}
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2 text-gray-400" />
                      {trade.from_team?.city && trade.from_team?.name && trade.from_team.name !== 'Unknown Team'
                        ? `${trade.from_team.city} ${trade.from_team.name}` 
                        : trade.from_team?.name && trade.from_team.name !== 'Unknown Team'
                        ? trade.from_team.name
                        : trade.from_team?.city
                        ? trade.from_team.city
                        : 'Team TBD'
                      } Sends
                    </h4>
                    <div className="space-y-2">
                      {trade.fromPlayers.length > 0 ? (
                        trade.fromPlayers.map((player) => (
                          <div key={player.id} className="border border-gray-600 rounded-lg p-3 bg-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{player.playerName}</span>
                                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                                  {player.position}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-white">
                                  OVR {player.overall_rating}
                                </span>
                                {player.devTrait && player.devTrait !== 'Normal' && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    player.devTrait === 'Star' ? 'bg-yellow-900 text-yellow-200' :
                                    player.devTrait === 'Superstar' ? 'bg-purple-900 text-purple-200' :
                                    'bg-gray-600 text-gray-200'
                                  }`}>
                                    {player.devTrait}
                                  </span>
                                )}
                              </div>
                            </div>
                            {player.player_value && (
                              <div className="text-xs text-blue-400 mt-1">
                                Value: {player.player_value.toFixed(1)}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No players</div>
                      )}
                    </div>
                  </div>
                  
                  {/* To Team Players */}
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center">
                      <ArrowLeft className="w-4 h-4 mr-2 text-gray-400" />
                      {trade.to_team?.city && trade.to_team?.name && trade.to_team.name !== 'Unknown Team'
                        ? `${trade.to_team.city} ${trade.to_team.name}` 
                        : trade.to_team?.name && trade.to_team.name !== 'Unknown Team'
                        ? trade.to_team.name
                        : trade.to_team?.city
                        ? trade.to_team.city
                        : 'Team TBD'
                      } Sends
                    </h4>
                    <div className="space-y-2">
                      {trade.toPlayers.length > 0 ? (
                        trade.toPlayers.map((player) => (
                          <div key={player.id} className="border border-gray-600 rounded-lg p-3 bg-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{player.playerName}</span>
                                <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded">
                                  {player.position}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-white">
                                  OVR {player.overall_rating}
                                </span>
                                {player.devTrait && player.devTrait !== 'Normal' && (
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    player.devTrait === 'Star' ? 'bg-yellow-900 text-yellow-200' :
                                    player.devTrait === 'Superstar' ? 'bg-purple-900 text-purple-200' :
                                    'bg-gray-600 text-gray-200'
                                  }`}>
                                    {player.devTrait}
                                  </span>
                                )}
                              </div>
                            </div>
                            {player.player_value && (
                              <div className="text-xs text-blue-400 mt-1">
                                Value: {player.player_value.toFixed(1)}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No players</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trade Message */}
                {trade.message && (
                  <div className="mb-4 p-3 bg-blue-900 rounded-lg">
                    <p className="text-sm text-blue-200 italic">
                      &ldquo;{trade.message}&rdquo;
                    </p>
                  </div>
                )}

                {/* Voting Section */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                  <div className="flex space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        submitVote(trade.id, 'approve');
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve</span>
                      <span className="bg-green-700 px-2 py-1 rounded text-xs">
                        {trade.votes_summary?.approve_count || 0}
                      </span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        submitVote(trade.id, 'reject');
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                      <span className="bg-red-700 px-2 py-1 rounded text-xs">
                        {trade.votes_summary?.reject_count || 0}
                      </span>
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    {trade.votes_summary?.total_votes || 0}/{trade.votes_summary?.votes_needed || 0} votes needed
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
