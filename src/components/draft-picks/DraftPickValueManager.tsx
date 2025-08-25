import React, { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '@/lib/config'

interface DraftPickValue {
  id: string
  league_id: number
  round_num: number
  pick_in_round: number
  value: number
  created_at: string
  updated_at: string
}

interface LeagueDraftSettings {
  id: number
  league_id: number
  current_season_year: number
  future_year_multiplier: number
  beyond_future_multiplier: number
  created_at: string
  updated_at: string
}

interface DraftPickValueManagerProps {
  leagueId: string
  onValuesUpdated?: () => void
}

export default function DraftPickValueManager({ leagueId, onValuesUpdated }: DraftPickValueManagerProps) {
  const [draftPickValues, setDraftPickValues] = useState<DraftPickValue[]>([])
  const [leagueSettings, setLeagueSettings] = useState<LeagueDraftSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingValues, setEditingValues] = useState<Record<string, number>>({})
  const [showSettings, setShowSettings] = useState(false)

  // Load draft pick values
  const loadDraftPickValues = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/values`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.values) {
          setDraftPickValues(data.values)
        }
      }
    } catch (error) {
      console.error('Error loading draft pick values:', error)
    } finally {
      setLoading(false)
    }
  }, [leagueId])

  // Load league settings
  const loadLeagueSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/settings`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setLeagueSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error loading league settings:', error)
    }
  }, [leagueId])

  // Update individual value
  const updateValue = async (round: number, pickInRound: number, value: number) => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/value`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ round, pickInRound, value })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await loadDraftPickValues()
          onValuesUpdated?.()
        }
      }
    } catch (error) {
      console.error('Error updating draft pick value:', error)
    }
  }

  // Bulk update values
  const bulkUpdateValues = async () => {
    try {
      const values = Object.entries(editingValues).map(([key, value]) => {
        const [round, pickInRound] = key.split('-').map(Number)
        return { round, pickInRound, value }
      })

      const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/bulk-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ values })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEditingValues({})
          await loadDraftPickValues()
          onValuesUpdated?.()
        }
      }
    } catch (error) {
      console.error('Error bulk updating values:', error)
    }
  }

  // Update league settings
  const updateLeagueSettings = async (settings: Partial<LeagueDraftSettings>) => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await loadLeagueSettings()
          onValuesUpdated?.()
        }
      }
    } catch (error) {
      console.error('Error updating league settings:', error)
    }
  }

  // Reset to defaults
  const resetToDefaults = async () => {
    try {
      const response = await fetch(`${API_BASE}/leagues/${leagueId}/draft-picks/reset`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await Promise.all([loadDraftPickValues(), loadLeagueSettings()])
          onValuesUpdated?.()
        }
      }
    } catch (error) {
      console.error('Error resetting to defaults:', error)
    }
  }

  // Handle value change
  const handleValueChange = (round: number, pickInRound: number, value: number) => {
    const key = `${round}-${pickInRound}`
    setEditingValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Load data on mount
  useEffect(() => {
    loadDraftPickValues()
    loadLeagueSettings()
  }, [loadDraftPickValues, loadLeagueSettings])

  // Generate table rows for rounds 1-7
  const generateTableRows = () => {
    const rows = []
    for (let round = 1; round <= 7; round++) {
      const roundValues = draftPickValues.filter(v => v.round_num === round)
      const maxPicks = 32 // All rounds have 32 picks
      
      for (let pick = 1; pick <= maxPicks; pick++) {
        const existingValue = roundValues.find(v => v.pick_in_round === pick)
        const key = `${round}-${pick}`
        const editingValue = editingValues[key] ?? existingValue?.value ?? 0
        
        rows.push({
          round,
          pick,
          value: existingValue?.value ?? 0,
          editingValue,
          key
        })
      }
    }
    return rows
  }

  const tableRows = generateTableRows()

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Draft Pick Value Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            {showSettings ? 'Hide Settings' : 'League Settings'}
          </button>
          <button
            onClick={resetToDefaults}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* League Settings */}
      {showSettings && leagueSettings && (
        <div className="bg-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">League Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Current Season Year</label>
              <input
                type="number"
                value={leagueSettings.current_season_year}
                onChange={(e) => updateLeagueSettings({ current_season_year: parseInt(e.target.value) })}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Future Year Multiplier</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={leagueSettings.future_year_multiplier}
                onChange={(e) => updateLeagueSettings({ future_year_multiplier: parseFloat(e.target.value) })}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Beyond Future Multiplier</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={leagueSettings.beyond_future_multiplier}
                onChange={(e) => updateLeagueSettings({ beyond_future_multiplier: parseFloat(e.target.value) })}
                className="w-full bg-gray-600 text-white border border-gray-500 rounded px-3 py-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Draft Pick Values Table */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Draft Pick Values</h3>
          <button
            onClick={bulkUpdateValues}
            disabled={Object.keys(editingValues).length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
          >
            Save All Changes
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-300 py-8">Loading draft pick values...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left text-gray-300 p-2">Round</th>
                  <th className="text-left text-gray-300 p-2">Pick</th>
                  <th className="text-left text-gray-300 p-2">Value</th>
                  <th className="text-left text-gray-300 p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.key} className="border-b border-gray-600 hover:bg-gray-600">
                    <td className="text-white p-2">R{row.round}</td>
                    <td className="text-white p-2">P{row.pick}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={row.editingValue}
                        onChange={(e) => handleValueChange(row.round, row.pick, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-gray-600 text-white border border-gray-500 rounded px-2 py-1"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => updateValue(row.round, row.pick, row.editingValue)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">How to Use</h3>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• Edit individual values by typing in the input fields</li>
          <li>• Use &quot;Save&quot; to update a single value immediately</li>
          <li>• Use &quot;Save All Changes&quot; to update multiple values at once</li>
          <li>• Adjust league settings for year multipliers</li>
          <li>• Reset to defaults if you want to start over</li>
        </ul>
      </div>
    </div>
  )
}
