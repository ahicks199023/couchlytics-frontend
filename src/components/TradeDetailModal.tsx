'use client';

import { useState } from 'react';

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

interface TradeDetailModalProps {
  trade: PendingTrade;
  onClose: () => void;
  onVote: (tradeId: number, vote: 'approve' | 'reject') => void;
  voting: boolean;
  voteReasoning: string;
  setVoteReasoning: (reasoning: string) => void;
  currentUserId?: number;
}

export default function TradeDetailModal({
  trade,
  onClose,
  onVote,
  voting,
  voteReasoning,
  setVoteReasoning,
  currentUserId
}: TradeDetailModalProps) {
  const [showVoteForm, setShowVoteForm] = useState(false);

  const hasUserVoted = trade.committee_votes.some((vote) => 
    vote.user_id === currentUserId
  );

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

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('approve') || rec.includes('fair')) return 'text-green-600';
    if (rec.includes('reject') || rec.includes('unfair')) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-white">
              🏛️ Trade #{trade.id} - Committee Review
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Trade Analysis */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Trade Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Fairness Score</div>
                <div className={`text-4xl font-bold ${getFairnessColor(trade.fairness_score)}`}>
                  {trade.fairness_score}%
                </div>
                <div className="text-sm text-gray-400">
                  {getFairnessLabel(trade.fairness_score)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Recommendation</div>
                <div className={`text-lg font-semibold ${getRecommendationColor(trade.trade_analysis?.recommendation || '')}`}>
                  {trade.trade_analysis?.recommendation || 'Pending Analysis'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Status</div>
                <div className="text-lg font-semibold text-orange-400">
                  Committee Review
                </div>
                <div className="text-sm text-gray-400">
                  {trade.votes_summary.total_votes}/{trade.votes_summary.votes_needed} votes
                </div>
              </div>
            </div>
            {trade.trade_analysis?.analysis && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="text-sm text-gray-400 mb-2">Analysis</div>
                <div className="text-sm text-gray-300 leading-relaxed">
                  {trade.trade_analysis.analysis}
                </div>
              </div>
            )}
          </div>

          {/* Trade Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4">
                {trade.from_team.city} {trade.from_team.name} Sends:
              </h3>
              <div className="space-y-3">
                {trade.fromPlayers.length > 0 ? (
                  trade.fromPlayers.map((player) => (
                    <div key={player.id} className="bg-gray-600 rounded p-3 border border-gray-500">
                      <div className="font-medium text-white">{player.playerName}</div>
                      <div className="text-sm text-gray-300">
                        {player.position} • OVR {player.overall_rating}
                      </div>
                      {player.player_value && (
                        <div className="text-sm text-blue-400">
                          Value: {player.player_value}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">No players</div>
                )}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-4">
                {trade.to_team.city} {trade.to_team.name} Sends:
              </h3>
              <div className="space-y-3">
                {trade.toPlayers.length > 0 ? (
                  trade.toPlayers.map((player) => (
                    <div key={player.id} className="bg-gray-600 rounded p-3 border border-gray-500">
                      <div className="font-medium text-white">{player.playerName}</div>
                      <div className="text-sm text-gray-300">
                        {player.position} • OVR {player.overall_rating}
                      </div>
                      {player.player_value && (
                        <div className="text-sm text-blue-400">
                          Value: {player.player_value}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-center py-4">No players</div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Message */}
          {trade.message && (
            <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-2">💬 Trade Message</h3>
              <div className="text-gray-300">{trade.message}</div>
            </div>
          )}

          {/* Vote History */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">🗳️ Committee Votes</h3>
            {trade.committee_votes.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No votes cast yet</div>
            ) : (
              <div className="space-y-3">
                {trade.committee_votes.map((vote) => (
                  <div key={vote.id} className="flex justify-between items-start bg-gray-600 rounded p-3 border border-gray-500">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {vote.user.first_name} {vote.user.last_name}
                      </div>
                      {vote.reasoning && (
                        <div className="text-sm text-gray-300 mt-1">{vote.reasoning}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(vote.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded text-sm font-medium ${
                      vote.vote === 'approve' 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {vote.vote === 'approve' ? '✅ Approve' : '❌ Reject'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Voting Form */}
          {!hasUserVoted && (
            <div className="border-t border-gray-600 pt-6">
              {!showVoteForm ? (
                <div className="text-center">
                  <button
                    onClick={() => setShowVoteForm(true)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium text-lg"
                  >
                    🗳️ Cast Your Vote
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      💭 Voting Reasoning (Optional)
                    </label>
                    <textarea
                      value={voteReasoning}
                      onChange={(e) => setVoteReasoning(e.target.value)}
                      className="w-full bg-gray-600 border border-gray-500 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      rows={4}
                      placeholder="Explain your reasoning for this vote..."
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => onVote(trade.id, 'approve')}
                      disabled={voting}
                      className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium text-lg flex items-center justify-center"
                    >
                      {voting ? '⏳ Submitting...' : '✅ Approve Trade'}
                    </button>
                    <button
                      onClick={() => onVote(trade.id, 'reject')}
                      disabled={voting}
                      className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium text-lg flex items-center justify-center"
                    >
                      {voting ? '⏳ Submitting...' : '❌ Reject Trade'}
                    </button>
                    <button
                      onClick={() => setShowVoteForm(false)}
                      className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 font-medium text-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {hasUserVoted && (
            <div className="border-t border-gray-600 pt-6">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">
                  ✅ You have already voted on this trade
                </div>
                <div className="text-sm text-gray-500">
                  Your vote has been recorded and will be counted in the final decision.
                </div>
              </div>
            </div>
          )}

          {/* Trade Metadata */}
          <div className="border-t border-gray-600 pt-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
              <div>
                <span className="font-medium">Created:</span> {new Date(trade.created_at).toLocaleString()}
              </div>
              {trade.expires_at && (
                <div>
                  <span className="font-medium">Expires:</span> {new Date(trade.expires_at).toLocaleString()}
                </div>
              )}
              <div>
                <span className="font-medium">From User:</span> {trade.from_user.first_name} {trade.from_user.last_name}
              </div>
              <div>
                <span className="font-medium">To User:</span> {trade.to_user.first_name} {trade.to_user.last_name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
