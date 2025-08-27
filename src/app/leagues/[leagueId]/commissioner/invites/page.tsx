'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Invite {
  id: number;
  email: string;
  role: string;
  team_id: number | null;
  invite_code: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  is_active: boolean;
}

interface Team {
  id: number;
  name: string;
  abbreviation: string;
  city: string;
}

export default function InvitesPage() {
  const params = useParams();
  const leagueId = params.leagueId;
  const [invites, setInvites] = useState<Invite[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'user',
    team_id: null as number | null
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (leagueId) {
      fetchData();
    }
  }, [leagueId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [invitesResponse, teamsResponse] = await Promise.all([
        fetch(`/backend-api/leagues/${leagueId}/invites`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch(`/backend-api/leagues/${leagueId}/commissioner/teams`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        })
      ]);

      if (!invitesResponse.ok || !teamsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [invitesData, teamsData] = await Promise.all([
        invitesResponse.json(),
        teamsResponse.json()
      ]);

      setInvites(invitesData.invites);
      setTeams(teamsData.teams);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!newInvite.email.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      setCreating(true);
      
      const response = await fetch(`/backend-api/leagues/${leagueId}/invites`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvite),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create invite');
      }

      const data = await response.json();
      
      // Show success message with invite URL
      alert(`Invite created successfully!\nInvite URL: ${data.invite_url}\n\nThis link has been sent to ${newInvite.email}`);
      
      // Reset form and refresh data
      setNewInvite({ email: '', role: 'user', team_id: null });
      setShowCreateForm(false);
      await fetchData();
      
    } catch (error) {
      console.error('Error creating invite:', error);
      alert(error instanceof Error ? error.message : 'Failed to create invite');
    } finally {
      setCreating(false);
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteUrl = `https://www.couchlytics.com/join/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    alert('Invite link copied to clipboard!');
  };

  const revokeInvite = async (inviteId: number) => {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return;
    }

    try {
      const response = await fetch(`/backend-api/leagues/${leagueId}/invites/${inviteId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke invite');
      }

      await fetchData(); // Refresh data
      
    } catch (error) {
      console.error('Error revoking invite:', error);
      alert('Failed to revoke invite');
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
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href={`/leagues/${leagueId}/commissioner`}
          className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
        >
          ← Back to Commissioner's Hub
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">League Invites</h1>
            <p className="text-gray-400">Manage league invitations and member recruitment</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
          >
            + Send Invite
          </button>
        </div>
      </div>

      {/* Create Invite Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-white mb-4">Send League Invite</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                <select
                  value={newInvite.role}
                  onChange={(e) => setNewInvite(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="trade_committee_member">Trade Committee Member</option>
                  <option value="co-commissioner">Co-Commissioner</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assign Team (Optional)</label>
                <select
                  value={newInvite.team_id || ''}
                  onChange={(e) => setNewInvite(prev => ({ 
                    ...prev, 
                    team_id: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">No team assigned</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.city} {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createInvite}
                disabled={creating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white text-sm"
              >
                {creating ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invites List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">Sent Invitations</h2>
        
        {invites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No invitations sent yet</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
            >
              Send Your First Invite
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Sent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {invites.map((invite) => {
                  const team = teams.find(t => t.id === invite.team_id);
                  const isExpired = new Date(invite.expires_at) < new Date();
                  
                  return (
                    <tr key={invite.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {invite.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {invite.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {team ? `${team.city} ${team.name}` : 'No team'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          invite.used_at ? 'bg-green-900 text-green-200' :
                          isExpired ? 'bg-red-900 text-red-200' :
                          'bg-yellow-900 text-yellow-200'
                        }`}>
                          {invite.used_at ? 'Accepted' : isExpired ? 'Expired' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!invite.used_at && !isExpired && (
                          <>
                            <button
                              onClick={() => copyInviteLink(invite.invite_code)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              Copy Link
                            </button>
                            <button
                              onClick={() => revokeInvite(invite.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Revoke
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Instructions */}
      <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-medium mb-2">💡 How Invites Work</h3>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• Invites are sent via email with a unique join link</li>
          <li>• If the person doesn't have an account, they'll be prompted to register</li>
          <li>• After registration/login, they'll automatically join your league</li>
          <li>• Invites expire after 7 days for security</li>
          <li>• You can assign roles and teams when sending the invite</li>
        </ul>
      </div>
    </div>
  );
}
