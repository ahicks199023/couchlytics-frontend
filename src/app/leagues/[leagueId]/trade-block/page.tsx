'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TradeBlockPlayer {
  id: number;
  player_id: number;
  player_name: string;
  position: string;
  team: string;
  owner_name: string;
  owner_id: number;
  asking_price: string;
  notes: string;
  listed_at: string;
  position_rank: number;
  overall_rank: number;
}

interface TradeBlockComment {
  id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

export default function TradeBlockPage() {
  const params = useParams();
  const leagueId = params.leagueId;
  const [players, setPlayers] = useState<TradeBlockPlayer[]>([]);
  const [comments, setComments] = useState<TradeBlockComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string>('ALL');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTradeBlockData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [playersResponse, commentsResponse] = await Promise.all([
        fetch(`/backend-api/leagues/${leagueId}/trade-block?position=${selectedPosition}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/backend-api/leagues/${leagueId}/trade-block/comments`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      ]);

      if (!playersResponse.ok || !commentsResponse.ok) {
        throw new Error('Failed to fetch trade block data');
      }

      const [playersData, commentsData] = await Promise.all([
        playersResponse.json(),
        commentsResponse.json()
      ]);

      setPlayers(playersData.players);
      setComments(commentsData.comments);
      
    } catch (err) {
      console.error('Error fetching trade block data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trade block');
    } finally {
      setLoading(false);
    }
  }, [leagueId, selectedPosition]);

  useEffect(() => {
    if (leagueId) {
      fetchTradeBlockData();
    }
  }, [leagueId, selectedPosition, fetchTradeBlockData]);

  const submitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      
      const response = await fetch(`/backend-api/leagues/${leagueId}/trade-block/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }

      setNewComment('');
      await fetchTradeBlockData(); // Refresh comments
      
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const sendTradeOffer = async (playerId: number, ownerId: number) => {
    try {
      const response = await fetch(`/backend-api/leagues/${leagueId}/trades/offer`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to_user_id: ownerId,
          players_wanted: [playerId],
          message: 'Trade offer from trade block'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send trade offer');
      }

      alert('Trade offer sent successfully!');
      
    } catch (err) {
      console.error('Error sending trade offer:', err);
      alert('Failed to send trade offer');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
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
            onClick={fetchTradeBlockData}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredPlayers = selectedPosition === 'ALL' 
    ? players 
    : players.filter(p => p.position === selectedPosition);

  const groupedPlayers = POSITIONS.reduce((acc, pos) => {
    acc[pos] = filteredPlayers.filter(p => p.position === pos);
    return acc;
  }, {} as Record<string, TradeBlockPlayer[]>);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/leagues/${leagueId}`}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
        >
          ← Back to League
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Trade Block</h1>
        <p className="text-gray-400">Browse players available for trade and discuss potential deals</p>
      </div>

      {/* Position Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedPosition('ALL')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              selectedPosition === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Positions
          </button>
          {POSITIONS.map((position) => (
            <button
              key={position}
              onClick={() => setSelectedPosition(position)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedPosition === position
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {position} ({groupedPlayers[position]?.length || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid gap-6 mb-8">
        {(selectedPosition === 'ALL' ? POSITIONS : [selectedPosition]).map((position) => {
          const positionPlayers = groupedPlayers[position] || [];
          
          if (positionPlayers.length === 0 && selectedPosition !== 'ALL') return null;

          return (
            <div key={position} className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {position === 'ALL' ? 'All Players' : `${position} (${positionPlayers.length})`}
              </h2>
              
              {positionPlayers.length === 0 ? (
                <p className="text-gray-400">No players available at this position</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {positionPlayers.map((player) => (
                    <div key={player.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-white">{player.player_name}</h3>
                          <p className="text-sm text-gray-400">{player.team} • {player.position}</p>
                          <p className="text-xs text-gray-500">
                            Rank: #{player.position_rank} {player.position} • #{player.overall_rank} Overall
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          player.position === 'QB' ? 'bg-red-900 text-red-200' :
                          player.position === 'RB' ? 'bg-green-900 text-green-200' :
                          player.position === 'WR' ? 'bg-blue-900 text-blue-200' :
                          player.position === 'TE' ? 'bg-yellow-900 text-yellow-200' :
                          player.position === 'K' ? 'bg-purple-900 text-purple-200' :
                          'bg-gray-900 text-gray-200'
                        }`}>
                          {player.position}
                        </span>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-300 mb-1">
                          <strong>Owner:</strong> {player.owner_name}
                        </p>
                        <p className="text-sm text-gray-300 mb-1">
                          <strong>Asking Price:</strong> {player.asking_price}
                        </p>
                        {player.notes && (
                          <p className="text-sm text-gray-400">
                            <strong>Notes:</strong> {player.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span>Listed {new Date(player.listed_at).toLocaleDateString()}</span>
                      </div>
                      
                      <button
                        onClick={() => sendTradeOffer(player.player_id, player.owner_id)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium"
                      >
                        Send Trade Offer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Discussion Board */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Trade Block Discussion</h2>
        
        {/* Comment Form */}
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on available players or potential trades..."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={submitComment}
              disabled={!newComment.trim() || submittingComment}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white text-sm"
            >
              {submittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
        
        {/* Comments */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <strong className="text-white">{comment.user_name}</strong>
                  <span className="text-xs text-gray-400">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}