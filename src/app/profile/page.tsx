'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  last_username_change: string | null;
  notification_settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    trade_notifications: boolean;
    league_announcements: boolean;
    chat_notifications: boolean;
  };
  subscription: {
    status: 'free' | 'premium' | 'pro';
    expires_at: string | null;
    auto_renew: boolean;
  };
  leagues_as_commissioner: Array<{
    id: number;
    name: string;
    season_year: number;
    member_count: number;
  }>;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'notifications' | 'subscription' | 'leagues'>('personal');

  // Form states
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    username: ''
  });
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    trade_notifications: true,
    league_announcements: true,
    chat_notifications: true
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/backend-api/user/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data.profile);
      
      // Initialize form states
      setPersonalInfo({
        first_name: data.profile.first_name || '',
        last_name: data.profile.last_name || '',
        username: data.profile.username || ''
      });
      setNotifications(data.profile.notification_settings);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePersonalInfo = async () => {
    try {
      setSaving(true);
      const response = await fetch('/backend-api/user/profile/personal', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update personal information');
      }

      await fetchProfile(); // Refresh profile data
      alert('Personal information updated successfully!');
      
    } catch (err) {
      console.error('Error updating personal info:', err);
      alert(err instanceof Error ? err.message : 'Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch('/backend-api/user/profile/notifications', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }

      await fetchProfile(); // Refresh profile data
      alert('Notification settings updated successfully!');
      
    } catch (err) {
      console.error('Error updating notifications:', err);
      alert('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const requestPasswordReset = async () => {
    try {
      setSaving(true);
      const response = await fetch('/backend-api/user/password-reset-request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: profile?.email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }

      alert('Password reset email sent! Check your inbox.');
      
    } catch (err) {
      console.error('Error requesting password reset:', err);
      alert('Failed to send password reset email');
    } finally {
      setSaving(false);
    }
  };

  const canChangeUsername = () => {
    if (!profile?.last_username_change) return true;
    
    const lastChange = new Date(profile.last_username_change);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    return lastChange < threeMonthsAgo;
  };

  const getNextUsernameChangeDate = () => {
    if (!profile?.last_username_change) return null;
    
    const lastChange = new Date(profile.last_username_change);
    const nextChange = new Date(lastChange);
    nextChange.setMonth(nextChange.getMonth() + 3);
    
    return nextChange.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Error: {error || 'Failed to load profile'}</p>
          <button 
            onClick={fetchProfile}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
        <p className="text-gray-400">Manage your account and profile settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-8">
        <nav className="flex space-x-8">
          {[
            { key: 'personal', label: 'Personal Information' },
            { key: 'notifications', label: 'Notifications' },
            { key: 'subscription', label: 'Subscription' },
            { key: 'leagues', label: 'Your Leagues' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'personal' | 'notifications' | 'subscription' | 'leagues')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Personal Information Tab */}
      {activeTab === 'personal' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
          
          <div className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact support if needed.</p>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input
                type="text"
                value={personalInfo.first_name}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input
                type="text"
                value={personalInfo.last_name}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                value={personalInfo.username}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, username: e.target.value }))}
                disabled={!canChangeUsername()}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              {!canChangeUsername() && (
                <p className="text-xs text-yellow-400 mt-1">
                  Username can be changed again on {getNextUsernameChangeDate()}
                </p>
              )}
            </div>

            {/* Password Reset */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <button
                onClick={requestPasswordReset}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-white text-sm"
              >
                {saving ? 'Sending...' : 'Send Password Reset Email'}
              </button>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={updatePersonalInfo}
                disabled={saving}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-white font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Notification Settings</h2>
          
          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <p className="text-xs text-gray-400">
                    {key === 'email_notifications' && 'Receive notifications via email'}
                    {key === 'push_notifications' && 'Receive browser push notifications'}
                    {key === 'trade_notifications' && 'Get notified about trade offers and updates'}
                    {key === 'league_announcements' && 'Receive league announcements from commissioners'}
                    {key === 'chat_notifications' && 'Get notified about new chat messages'}
                  </p>
                </div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                    className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <button
              onClick={updateNotificationSettings}
              disabled={saving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded text-white font-medium"
            >
              {saving ? 'Saving...' : 'Save Notification Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Subscription Management</h2>
          
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-400">Subscription Management Coming Soon</h3>
                <p className="text-sm text-yellow-300 mt-1">
                  Subscription management will be available when the platform goes live. Currently all features are free to use.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Current Plan:</span>
              <span className="text-green-400 font-medium">Free (Beta)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Features Included:</span>
              <span className="text-gray-400">All features available during beta</span>
            </div>
          </div>
        </div>
      )}

      {/* Your Leagues Tab */}
      {activeTab === 'leagues' && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Your Leagues</h2>
          
          {profile.leagues_as_commissioner.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300">Leagues You Commissioner</h3>
              <div className="grid gap-4">
                {profile.leagues_as_commissioner.map((league) => (
                  <div key={league.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-white">{league.name}</h4>
                      <p className="text-sm text-gray-400">
                        {league.season_year} Season • {league.member_count} members
                      </p>
                    </div>
                    <Link
                      href={`/leagues/${league.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                    >
                      Manage League
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">You are not currently commissioning any leagues.</p>
              <Link
                href="/leagues/create"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium"
              >
                Create Your First League
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}