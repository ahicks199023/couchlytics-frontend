'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface LeagueSettings {
  league_id: string;
  name: string;
  season_year: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  max_teams: number;
  scoring_type: string;
  draft_type: string;
  trade_deadline: string | null;
  playoff_teams: number;
  regular_season_weeks: number;
}

export default function CommissionerSettingsPage() {
  const params = useParams();
  const leagueId = params.leagueId;
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`https://www.couchlytics.com/leagues/${leagueId}/commissioner/settings`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSettings(data.settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch settings');
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      fetchSettings();
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

  if (!settings) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">No settings found for this league</p>
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
        <h1 className="text-2xl font-bold text-white">League Settings</h1>
        <p className="text-gray-400 mt-2">Configure league rules, scoring, and general settings</p>
      </div>

      {/* Settings Grid */}
      <div className="bg-gray-800 shadow rounded-lg border border-gray-700">
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-400">League Name</dt>
              <dd className="mt-1 text-sm text-white">{settings.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Season Year</dt>
              <dd className="mt-1 text-sm text-white">{settings.season_year}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Max Teams</dt>
              <dd className="mt-1 text-sm text-white">{settings.max_teams}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Scoring Type</dt>
              <dd className="mt-1 text-sm text-white">{settings.scoring_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Draft Type</dt>
              <dd className="mt-1 text-sm text-white">{settings.draft_type}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Playoff Teams</dt>
              <dd className="mt-1 text-sm text-white">{settings.playoff_teams}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Regular Season Weeks</dt>
              <dd className="mt-1 text-sm text-white">{settings.regular_season_weeks}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Trade Deadline</dt>
              <dd className="mt-1 text-sm text-white">
                {settings.trade_deadline 
                  ? new Date(settings.trade_deadline).toLocaleDateString() 
                  : 'Not set'
                }
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Status</dt>
              <dd className="mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  settings.is_active 
                    ? 'bg-green-900 text-green-200' 
                    : 'bg-red-900 text-red-200'
                }`}>
                  {settings.is_active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Created</dt>
              <dd className="mt-1 text-sm text-white">
                {new Date(settings.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Last Updated</dt>
              <dd className="mt-1 text-sm text-white">
                {new Date(settings.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
          Edit Settings
        </button>
        <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
          Export Settings
        </button>
      </div>

      {/* Footer */}
      <div className="mt-6 text-xs text-gray-500 text-center">
        League settings are managed through the commissioner API
      </div>
    </div>
  );
}
