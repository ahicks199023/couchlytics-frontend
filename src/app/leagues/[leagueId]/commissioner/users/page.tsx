'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/config';

interface User {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  name: string;
  role: string;
  joined_at: string;
  team_id: number | null;
  is_active: boolean;
}

interface Team {
  id: number;
  name: string;
  abbreviation: string;
  city: string;
  conference: string;
  division: string;
}

const ROLE_OPTIONS = [
  'commissioner',
  'co-commissioner',
  'trade_committee_member',
  'user'
];

export default function CommissionerUsersPage() {
  const params = useParams();
  const leagueId = params.leagueId;
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Starting fetchData...');
        console.log('🔍 League ID:', leagueId);
        
        // Fetch users and teams in parallel
        const [usersResponse, teamsResponse] = await Promise.all([
          fetch(`${API_BASE}/leagues/${leagueId}/commissioner/users`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }),
          fetch(`${API_BASE}/leagues/${leagueId}/commissioner/teams`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        ]);

        if (!usersResponse.ok) {
          throw new Error(`Users API error! status: ${usersResponse.status}`);
        }

        if (!teamsResponse.ok) {
          throw new Error(`Teams API error! status: ${teamsResponse.status}`);
        }

        const usersData = await usersResponse.json();
        const teamsData = await teamsResponse.json();
        
        console.log('🔍 Users response data:', usersData);
        console.log('🔍 Teams response data:', teamsData);
        
        setUsers(usersData.users);
        setTeams(teamsData.teams);
      } catch (err) {
        console.error('🔍 Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchData();
    }
  }, [leagueId]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setUpdatingUser(userId);
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/commissioner/users/${userId}/role`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update role: ${response.status}`);
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        )
      );

      console.log(`✅ Role updated successfully for user ${userId} to ${newRole}`);
    } catch (err) {
      console.error('❌ Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleTeamChange = async (userId: number, newTeamId: number | null) => {
    try {
      setUpdatingUser(userId);
      
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/commissioner/users/${userId}/team`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ team_id: newTeamId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update team: ${response.status}`);
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, team_id: newTeamId } : user
        )
      );

      console.log(`✅ Team updated successfully for user ${userId} to team ${newTeamId}`);
    } catch (err) {
      console.error('❌ Error updating team:', err);
      setError(err instanceof Error ? err.message : 'Failed to update team');
    } finally {
      setUpdatingUser(null);
    }
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
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-2">Manage league members, permissions, and user roles</p>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 shadow rounded-lg border border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-400">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingUser === user.id}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map(role => (
                          <option key={role} value={role}>
                            {role === 'trade_committee_member' 
                              ? 'Trade Committee Member' 
                              : role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')
                            }
                          </option>
                        ))}
                      </select>
                      {updatingUser === user.id && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.team_id || ''}
                        onChange={(e) => handleTeamChange(user.id, e.target.value ? parseInt(e.target.value) : null)}
                        disabled={updatingUser === user.id}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50 min-w-[150px]"
                      >
                        <option value="">Unassigned</option>
                        {teams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.city} {team.name}
                          </option>
                        ))}
                      </select>
                      {updatingUser === user.id && (
                        <div className="mt-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {user.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-900 text-green-200' 
                          : 'bg-red-900 text-red-200'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No users found in this league</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        User management data is fetched from the league commissioner API. Role and team assignments are updated in real-time.
      </div>
    </div>
  );
}
