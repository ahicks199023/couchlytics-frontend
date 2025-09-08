'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/config';
import InvitationManagement from '@/components/invitations/InvitationManagement';

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
  is_assigned?: boolean;
  user_id?: number;
  user_name?: string;
  user_email?: string;
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
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'invitations' | 'companion'>('users');
  const [companionAppUrl, setCompanionAppUrl] = useState<string>('');
  const [copyMessage, setCopyMessage] = useState<string>('');

  // Generate companion app URL
  useEffect(() => {
    if (leagueId) {
      setCompanionAppUrl(`https://api.couchlytics.com/api/companion-hook?leagueId=${leagueId}`);
    }
  }, [leagueId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage('URL copied to clipboard!');
      setTimeout(() => setCopyMessage(''), 3000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyMessage('Failed to copy URL');
      setTimeout(() => setCopyMessage(''), 3000);
    }
  };


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
        console.log('🔍 Individual users with team data:', usersData.users?.map((user: User) => ({
          id: user.id,
          email: user.email,
          team_id: user.team_id,
          name: user.name
        })));
        
        setUsers(usersData.users);
        
        // Handle both old and new API response structures
        if (teamsData.available_teams && teamsData.assigned_teams) {
          // New API structure with separated arrays
          setAvailableTeams(teamsData.available_teams);
          setAssignedTeams(teamsData.assigned_teams);
          setTeams(teamsData.teams || []);
          console.log('✅ Using new API structure:', {
            available: teamsData.available_teams.length,
            assigned: teamsData.assigned_teams.length,
            total: teamsData.teams?.length || 0
          });
        } else {
          // Fallback to old structure - filter teams manually
          const allTeams = teamsData.teams || [];
          const available = allTeams.filter((team: Team) => !team.is_assigned);
          const assigned = allTeams.filter((team: Team) => team.is_assigned);
          
          setAvailableTeams(available);
          setAssignedTeams(assigned);
          setTeams(allTeams);
          console.log('⚠️ Using fallback filtering:', {
            available: available.length,
            assigned: assigned.length,
            total: allTeams.length
          });
        }
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

      // Get the current user to find their old team
      const currentUser = users.find(user => user.id === userId);
      const oldTeamId = currentUser?.team_id;

      // Update users state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, team_id: newTeamId } : user
        )
      );

      // Update available teams - add old team back, remove new team
      setAvailableTeams(prevAvailable => {
        let updated = [...prevAvailable];
        
        // Add old team back to available if it exists
        if (oldTeamId) {
          const oldTeam = teams.find(team => team.id === oldTeamId);
          if (oldTeam && !updated.find(t => t.id === oldTeamId)) {
            updated.push({ ...oldTeam, is_assigned: false });
          }
        }
        
        // Remove new team from available
        if (newTeamId) {
          updated = updated.filter(team => team.id !== newTeamId);
        }
        
        return updated;
      });

      // Update assigned teams
      setAssignedTeams(prevAssigned => {
        let updated = [...prevAssigned];
        
        // Remove old team from assigned
        if (oldTeamId) {
          updated = updated.filter(team => team.id !== oldTeamId);
        }
        
        // Add new team to assigned
        if (newTeamId) {
          const newTeam = teams.find(team => team.id === newTeamId);
          if (newTeam) {
            updated.push({ ...newTeam, is_assigned: true });
          }
        }
        
        return updated;
      });

      console.log(`✅ Team updated successfully for user ${userId} to team ${newTeamId}`);
      console.log('📊 Updated team counts:', {
        available: availableTeams.length - (newTeamId ? 1 : 0) + (oldTeamId ? 1 : 0),
        assigned: assignedTeams.length + (newTeamId ? 1 : 0) - (oldTeamId ? 1 : 0)
      });
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
        <p className="text-gray-400 mt-2">Manage league members, invitations, and companion app integration</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              👥 League Members
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              📧 Invitations
            </button>
            <button
              onClick={() => setActiveTab('companion')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'companion'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              📱 Companion App
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && (
        <div className="bg-gray-800 shadow rounded-lg border border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          
          {/* Debug Information */}
          <div className="mb-4 p-3 bg-gray-700 rounded-md text-sm">
            <div className="font-semibold mb-2 text-yellow-400">🔧 Team Assignment Debug</div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-400">Available Teams:</span>
                <span className="text-green-400 ml-2 font-bold">{availableTeams.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Assigned Teams:</span>
                <span className="text-blue-400 ml-2 font-bold">{assignedTeams.length}</span>
              </div>
              <div>
                <span className="text-gray-400">Total Teams:</span>
                <span className="text-white ml-2 font-bold">{teams.length}</span>
              </div>
            </div>
          </div>
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
                      <div className="text-xs text-gray-400 mb-1">
                        Debug: team_id={user.team_id}, available={availableTeams.length}
                      </div>
                      <select
                        value={user.team_id || ''}
                        onChange={(e) => {
                          console.log(`🔄 Team change for user ${user.id}: ${user.team_id} -> ${e.target.value}`);
                          handleTeamChange(user.id, e.target.value ? parseInt(e.target.value) : null);
                        }}
                        disabled={updatingUser === user.id}
                        className="bg-gray-700 border border-gray-600 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500 disabled:opacity-50 min-w-[150px]"
                      >
                        <option value="">Unassigned</option>
                        {availableTeams.map(team => (
                          <option key={team.id} value={team.id}>
                            {team.city} {team.name}
                          </option>
                        ))}
                        {/* Also show currently assigned team for this user */}
                        {user.team_id && !availableTeams.find(t => t.id === user.team_id) && (
                          <option value={user.team_id} disabled>
                            {teams.find(t => t.id === user.team_id)?.city} {teams.find(t => t.id === user.team_id)?.name} (Current)
                          </option>
                        )}
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
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="bg-gray-800 shadow rounded-lg border border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <InvitationManagement leagueId={leagueId as string} />
          </div>
        </div>
      )}

      {/* Companion App Tab */}
      {activeTab === 'companion' && (
        <div className="bg-gray-800 shadow rounded-lg border border-gray-700">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-2xl font-bold mb-4">📱 Companion App Integration</h2>
            
            {copyMessage && (
              <div className="bg-green-600 text-white px-4 py-2 rounded mb-4">
                {copyMessage}
              </div>
            )}
            
            <div className="space-y-6">
              <div className="companion-app-section">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Companion App Export URL:
                </label>
                <div className="url-input-container flex gap-3 items-center">
                  <input 
                    type="text" 
                    value={companionAppUrl || 'Loading...'} 
                    readOnly 
                    className="url-input flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                    placeholder="https://api.couchlytics.com/api/companion-hook?leagueId=your-league-name"
                  />
                  <button 
                    onClick={() => copyToClipboard(companionAppUrl)}
                    className="copy-button bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!companionAppUrl}
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="setup-instructions bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3">
                  🎯 Setup Instructions
                </h4>
                <ol className="list-decimal ml-6 space-y-2 text-gray-300">
                  <li>Open the Madden Companion App on your device</li>
                  <li>Select your Franchise and navigate to League Settings</li>
                  <li>Find the &quot;Export League Data&quot; option</li>
                  <li>Paste the URL above into the export field</li>
                  <li>Tap &quot;Export&quot; - your league data will sync automatically!</li>
                </ol>
              </div>

              <div className="features-section bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3">
                  ✨ What Gets Synced
                </h4>
                <ul className="list-disc ml-6 space-y-1 text-gray-300">
                  <li>Team rosters and player information</li>
                  <li>League standings and statistics</li>
                  <li>Trade history and transactions</li>
                  <li>Draft picks and future assets</li>
                  <li>League settings and rules</li>
                </ul>
              </div>

              <div className="troubleshooting-section bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3">
                  🔧 Troubleshooting
                </h4>
                <div className="space-y-2 text-gray-300">
                  <p><strong>Export not working?</strong> Make sure you&apos;re using the latest version of the Madden Companion App.</p>
                  <p><strong>Data not syncing?</strong> Check that your league ID is correct in the URL above.</p>
                  <p><strong>Need help?</strong> Contact support if you continue to experience issues.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        User management data is fetched from the league commissioner API. Role and team assignments are updated in real-time.
      </div>
    </div>
  );
}
