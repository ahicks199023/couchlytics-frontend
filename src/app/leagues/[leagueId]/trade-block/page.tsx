'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/config';

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

const POSITIONS = [
  'QB', 'HB', 'FB', 'WR', 'TE', 
  'LT', 'LG', 'C', 'RG', 'RT',
  'LE', 'RE', 'DT', 'LOLB', 'MLB', 'ROLB',
  'CB', 'FS', 'SS', 'K', 'P'
];

const POSITION_LABELS = {
  'QB': 'QB',
  'HB': 'HB', 
  'FB': 'FB',
  'WR': 'WR',
  'TE': 'TE',
  'LT': 'LT',
  'LG': 'LG',
  'C': 'C',
  'RG': 'RG',
  'RT': 'RT',
  'LE': 'LE (Left End)',
  'RE': 'RE (Right End)',
  'DT': 'DT',
  'LOLB': 'SAM (LOLB)',
  'MLB': 'MIKE (MLB)',
  'ROLB': 'WILL (ROLB)',
  'CB': 'CB',
  'FS': 'FS',
  'SS': 'SS',
  'K': 'K',
  'P': 'P'
};

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
  const [showTradeBlockModal, setShowTradeBlockModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<TradeBlockPlayer | null>(null);
  const [tradeBlockNotes, setTradeBlockNotes] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [submittingTradeBlock, setSubmittingTradeBlock] = useState(false);

  const fetchTradeBlockData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [playersResponse, commentsResponse] = await Promise.all([
        fetch(`${API_BASE}/leagues/${leagueId}/trade-block?position=${selectedPosition}`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`${API_BASE}/leagues/${leagueId}/trade-block/comments`, {
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

      // Safe data handling with null checks
      console.log('Trade Block API Response:', { playersData, commentsData });
      
      // Handle players data safely - check for different possible structures
      let playersArray = [];
      if (playersData && playersData.players && Array.isArray(playersData.players)) {
        playersArray = playersData.players;
      } else if (playersData && playersData.trade_blocks && Array.isArray(playersData.trade_blocks)) {
        playersArray = playersData.trade_blocks;
      } else if (Array.isArray(playersData)) {
        playersArray = playersData;
      } else {
        console.warn('Unexpected players data structure:', playersData);
        playersArray = [];
      }
      
      // Handle comments data safely
      let commentsArray = [];
      if (commentsData && commentsData.comments && Array.isArray(commentsData.comments)) {
        commentsArray = commentsData.comments;
      } else if (Array.isArray(commentsData)) {
        commentsArray = commentsData;
      } else {
        console.warn('Unexpected comments data structure:', commentsData);
        commentsArray = [];
      }
      
      setPlayers(playersArray);
      setComments(commentsArray);
      
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
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/trade-block/comments`, {
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
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/trades/offer`, {
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

  const toggleTradeBlock = async (player: TradeBlockPlayer, isOnBlock: boolean) => {
    if (isOnBlock) {
      // Remove from trade block
      try {
        const response = await fetch(`${API_BASE}/leagues/${leagueId}/trade-block/${player.id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to remove player from trade block');
        }

        // Refresh data
        await fetchTradeBlockData();
        alert('Player removed from trade block');
        
      } catch (err) {
        console.error('Error removing player from trade block:', err);
        alert('Failed to remove player from trade block');
      }
    } else {
      // Add to trade block - show modal
      setSelectedPlayer(player);
      setShowTradeBlockModal(true);
    }
  };

  const submitTradeBlock = async () => {
    if (!selectedPlayer || !tradeBlockNotes.trim()) return;

    try {
      setSubmittingTradeBlock(true);
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/trade-block`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: selectedPlayer.player_id,
          notes: tradeBlockNotes.trim(),
          asking_price: askingPrice.trim() || 'Open to offers',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add player to trade block');
      }

      // Reset form and close modal
      setShowTradeBlockModal(false);
      setSelectedPlayer(null);
      setTradeBlockNotes('');
      setAskingPrice('');
      
      // Refresh data
      await fetchTradeBlockData();
      alert('Player added to trade block successfully!');
      
    } catch (err) {
      console.error('Error adding player to trade block:', err);
      alert('Failed to add player to trade block');
    } finally {
      setSubmittingTradeBlock(false);
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

  // Safe filtering with null checks
  const filteredPlayers = selectedPosition === 'ALL' 
    ? (players || [])
    : (players || []).filter(p => p && p.position === selectedPosition);

  // Safe grouping with null checks
  const groupedPlayers = POSITIONS.reduce((acc, pos) => {
    acc[pos] = (filteredPlayers || []).filter(p => p && p.position === pos);
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
        <div className="flex items-center gap-4">
          <label htmlFor="position-filter" className="text-white text-sm font-medium">
            Filter by Position:
          </label>
          <select
            id="position-filter"
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Positions</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {POSITION_LABELS[position as keyof typeof POSITION_LABELS]} ({groupedPlayers[position]?.length || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid gap-6 mb-8">
        {(selectedPosition === 'ALL' ? POSITIONS : [selectedPosition]).map((position) => {
          const positionPlayers = groupedPlayers[position] || [];
          
          // Skip rendering if no players and not showing all positions
          if (!positionPlayers || positionPlayers.length === 0) {
            if (selectedPosition === 'ALL') {
              return (
                <div key={position} className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">{position}</h2>
                  <p className="text-gray-400">No players available at this position</p>
                </div>
              );
            }
            return null;
          }

          return (
            <div key={position} className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {position === 'ALL' ? 'All Players' : `${position} (${positionPlayers.length})`}
              </h2>
              
              {positionPlayers.length === 0 ? (
                <p className="text-gray-400">No players available at this position</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {positionPlayers.map((player) => {
                    // Skip rendering if player data is invalid
                    if (!player || !player.player_name) {
                      return null;
                    }
                    
                    return (
                      <div key={player.id || `player-${Math.random()}`} className="bg-gray-700 rounded-lg p-4">
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
                        <span>Listed {(() => {
                          // Backend sends timestamps without timezone info, but they're actually UTC
                          // We need to append 'Z' to indicate UTC, then convert to local time
                          const utcTimestamp = player.listed_at.endsWith('Z') ? player.listed_at : player.listed_at + 'Z'
                          const listedTime = new Date(utcTimestamp)
                          
                          // Show full timestamp in user's local timezone
                          return listedTime.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true
                          })
                        })()}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendTradeOffer(player.player_id, player.owner_id)}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium"
                        >
                          Send Trade Offer
                        </button>
                        <button
                          onClick={() => toggleTradeBlock(player, true)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium"
                          title="Remove from Trade Block"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                  })}
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
          {!comments || comments.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((comment) => {
              // Skip rendering if comment data is invalid
              if (!comment || !comment.comment) {
                return null;
              }
              
              return (
                <div key={comment.id || `comment-${Math.random()}`} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <strong className="text-white">{comment.user_name}</strong>
                  <span className="text-xs text-gray-400">
                    {(() => {
                      // Backend sends timestamps without timezone info, but they're actually UTC
                      // We need to append 'Z' to indicate UTC, then convert to local time
                      const utcTimestamp = comment.created_at.endsWith('Z') ? comment.created_at : comment.created_at + 'Z'
                      const commentTime = new Date(utcTimestamp)
                      
                      // Show full timestamp in user's local timezone
                      return commentTime.toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      })
                    })()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{comment.comment}</p>
              </div>
            );
            })
          )}
        </div>
      </div>

      {/* Trade Block Modal */}
      {showTradeBlockModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              Add {selectedPlayer.player_name} to Trade Block
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What are you seeking in return?
                </label>
                <textarea
                  value={tradeBlockNotes}
                  onChange={(e) => setTradeBlockNotes(e.target.value)}
                  placeholder="Describe what you're looking for in a trade..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asking Price (Optional)
                </label>
                <input
                  type="text"
                  value={askingPrice}
                  onChange={(e) => setAskingPrice(e.target.value)}
                  placeholder="e.g., Draft picks, specific players, etc."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTradeBlockModal(false);
                  setSelectedPlayer(null);
                  setTradeBlockNotes('');
                  setAskingPrice('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitTradeBlock}
                disabled={!tradeBlockNotes.trim() || submittingTradeBlock}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white text-sm"
              >
                {submittingTradeBlock ? 'Adding...' : 'Add to Trade Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}