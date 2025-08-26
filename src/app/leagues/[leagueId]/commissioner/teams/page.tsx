'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Team {
  id: number;
  name: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
  is_assigned: boolean;
  user_id?: number;
  user_name?: string;
  user_email?: string;
}

export default function CommissionerTeamsPage() {
  const params = useParams();
  const leagueId = params.leagueId;
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`https://www.couchlytics.com/leagues/${leagueId}/commissioner/teams`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setTeams(data.teams);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchTeams();
    }
  }, [leagueId]);

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
        <h1 className="text-2xl font-bold text-white">Team Management</h1>
        <p className="text-gray-400 mt-2">Manage team assignments and league structure</p>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {teams.map((team) => (
          <div 
            key={team.id} 
            className={`bg-gray-800 rounded-lg p-4 border ${
              team.is_assigned ? 'border-green-600' : 'border-gray-600'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{team.name}</h3>
                <p className="text-sm text-gray-400">{team.city}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                team.is_assigned 
                  ? 'bg-green-900 text-green-200' 
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {team.is_assigned ? 'Assigned' : 'Available'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Conference:</span>
                <span className="text-white">{team.conference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Division:</span>
                <span className="text-white">{team.division}</span>
              </div>
              {team.is_assigned && team.user_name && (
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-gray-400 text-xs">Owner</div>
                  <div className="text-white font-medium">{team.user_name}</div>
                  {team.user_email && (
                    <div className="text-gray-400 text-xs">{team.user_email}</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {team.is_assigned ? (
                <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
                  Unassign
                </button>
              ) : (
                <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs">
                  Assign
                </button>
              )}
              <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">League Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{teams.length}</div>
            <div className="text-sm text-gray-400">Total Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {teams.filter(t => t.is_assigned).length}
            </div>
            <div className="text-sm text-gray-400">Assigned Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {teams.filter(t => !t.is_assigned).length}
            </div>
            <div className="text-sm text-gray-400">Available Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">
              {teams.filter(t => t.conference === 'AFC').length}
            </div>
            <div className="text-sm text-gray-400">AFC Teams</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
          Bulk Assign Teams
        </button>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
          Generate Invites
        </button>
        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
          Export Team Data
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        Team management data is fetched from the league commissioner API
      </div>
    </div>
  );
}
