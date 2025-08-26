'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { 
  evaluateTrade, 
  getRuleSuggestions, 
  resolveDispute, 
  getLeagueReport, 
  getAICommissionerHealth 
} from '@/lib/api'

interface TradeEvaluationData extends Record<string, unknown> {
  team1_id: number
  team2_id: number
  team1_players: Array<{player_id: number, name: string, position: string, value: number}>
  team2_players: Array<{player_id: number, name: string, position: string, value: number}>
}

interface DisputeData extends Record<string, unknown> {
  dispute_type: string
  teams_involved: number[]
  description: string
  evidence?: string
}

interface RuleSuggestion {
  title: string
  reasoning: string
  priority: 'high' | 'medium' | 'low'
  impact: 'positive' | 'negative' | 'neutral'
  implementation_notes: string
}

interface LeagueReport {
  summary: string
  health_score: number
  competitive_balance: number
  trade_activity: string
  engagement_score: number
  priority_actions: Array<{
    action: string
    description: string
    priority: string
  }>
  generated_at: string
}

interface TradeEvaluation {
  approved: boolean
  confidence: number
  reasoning: string
  recommendations?: string[]
  league_impact: string
  fairness_score: number
}

interface DisputeResolution {
  resolution: string
  reasoning: string
  recommended_action: string
  confidence: number
  affected_teams: number[]
}

interface HealthStatus {
  status: string
  service: string
  league_id: string
  timestamp: string
}

export default function AICommissioner() {
  const params = useParams()
  const leagueId = params.leagueId as string

  // State for different sections
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'rules' | 'disputes'>('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Trade evaluation state
  const [tradeData, setTradeData] = useState<TradeEvaluationData>({
    team1_id: 0,
    team2_id: 0,
    team1_players: [],
    team2_players: []
  })
  const [tradeEvaluation, setTradeEvaluation] = useState<TradeEvaluation | null>(null)

  // Rule suggestions state
  const [ruleSuggestions, setRuleSuggestions] = useState<RuleSuggestion[]>([])

  // Dispute resolution state
  const [disputeData, setDisputeData] = useState<DisputeData>({
    dispute_type: '',
    teams_involved: [],
    description: '',
    evidence: ''
  })
  const [disputeResolution, setDisputeResolution] = useState<DisputeResolution | null>(null)

  // League report state
  const [leagueReport, setLeagueReport] = useState<LeagueReport | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)

  const loadLeagueReport = useCallback(async () => {
    try {
      setIsLoading(true)
      const report = await getLeagueReport(leagueId)
      setLeagueReport(report)
    } catch (err) {
      setError('Failed to load league report')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [leagueId])

  const loadRuleSuggestions = useCallback(async () => {
    try {
      const suggestions = await getRuleSuggestions(leagueId)
      setRuleSuggestions(suggestions.suggestions || [])
    } catch (err) {
      console.error('Failed to load rule suggestions:', err)
    }
  }, [leagueId])

  const checkHealth = useCallback(async () => {
    try {
      const health = await getAICommissionerHealth(leagueId)
      setHealthStatus(health)
    } catch (err) {
      console.error('Failed to check AI Commissioner health:', err)
    }
  }, [leagueId])

  // Load initial data
  useEffect(() => {
    if (leagueId) {
      loadLeagueReport()
      loadRuleSuggestions()
      checkHealth()
    }
  }, [leagueId, loadLeagueReport, loadRuleSuggestions, checkHealth])

  const handleTradeEvaluation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const evaluation = await evaluateTrade(leagueId, tradeData)
      setTradeEvaluation(evaluation)
    } catch (err) {
      setError('Failed to evaluate trade')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisputeResolution = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const resolution = await resolveDispute(leagueId, disputeData)
      setDisputeResolution(resolution)
    } catch (err) {
      setError('Failed to resolve dispute')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const removePlayerFromTrade = (team: 'team1' | 'team2', playerId: number) => {
    setTradeData(prev => ({
      ...prev,
      [`${team}_players`]: prev[`${team}_players`].filter(p => p.player_id !== playerId)
    }))
  }

  const getHealthColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-400'
      case 'negative': return 'text-red-400'
      case 'neutral': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  if (!leagueId) {
    return <div className="text-center text-gray-400">League ID not found</div>
  }

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🤖 AI Commissioner</h1>
          <p className="text-gray-400">League-wide AI analysis and decision making</p>
        </div>

        {/* Health Status */}
        {healthStatus && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${healthStatus.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                {healthStatus.status === 'healthy' ? '🟢' : '🔴'}
              </span>
              <span className="text-white font-medium">AI Commissioner Status: {healthStatus.status}</span>
              <span className="text-gray-400 text-sm">• {healthStatus.service}</span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'trades', label: '🤝 Trade Evaluation', icon: '🤝' },
            { id: 'rules', label: '📋 Rule Suggestions', icon: '📋' },
            { id: 'disputes', label: '⚖️ Disputes', icon: '⚖️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'trades' | 'rules' | 'disputes')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
            <p className="text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && leagueReport && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* League Health */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">🏥 League Health</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm">Overall Health Score</p>
                    <p className={`text-2xl font-bold ${getHealthColor(leagueReport.health_score)}`}>
                      {Math.round(leagueReport.health_score * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Competitive Balance</p>
                    <p className={`text-xl font-semibold ${getHealthColor(leagueReport.competitive_balance)}`}>
                      {Math.round(leagueReport.competitive_balance * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Engagement Score</p>
                    <p className={`text-xl font-semibold ${getHealthColor(leagueReport.engagement_score)}`}>
                      {Math.round(leagueReport.engagement_score * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Trade Activity</p>
                    <p className="text-white font-medium capitalize">{leagueReport.trade_activity}</p>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">📋 League Summary</h3>
                <p className="text-gray-300 mb-4">{leagueReport.summary}</p>
                <div className="text-sm text-gray-400">
                  Generated: {new Date(leagueReport.generated_at).toLocaleString()}
                </div>
              </div>

              {/* Priority Actions */}
              <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-4">🎯 Priority Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {leagueReport.priority_actions.map((action, index) => (
                    <div key={index} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{action.action}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{action.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trade Evaluation Tab */}
          {activeTab === 'trades' && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-6">🤝 Trade Evaluation</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Team 1 */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Team 1</h4>
                  <input
                    type="number"
                    placeholder="Team 1 ID"
                    value={tradeData.team1_id || ''}
                    onChange={(e) => setTradeData(prev => ({ ...prev, team1_id: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-4"
                  />
                  <div className="space-y-2">
                    {tradeData.team1_players.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <span className="text-white text-sm">{player.name} ({player.position})</span>
                        <button
                          onClick={() => removePlayerFromTrade('team1', player.player_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team 2 */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Team 2</h4>
                  <input
                    type="number"
                    placeholder="Team 2 ID"
                    value={tradeData.team2_id || ''}
                    onChange={(e) => setTradeData(prev => ({ ...prev, team2_id: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-4"
                  />
                  <div className="space-y-2">
                    {tradeData.team2_players.map((player, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <span className="text-white text-sm">{player.name} ({player.position})</span>
                        <button
                          onClick={() => removePlayerFromTrade('team2', player.player_id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleTradeEvaluation}
                disabled={isLoading || !tradeData.team1_id || !tradeData.team2_id}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-md font-medium transition-colors"
              >
                {isLoading ? 'Evaluating...' : 'Evaluate Trade'}
              </button>

              {/* Trade Evaluation Result */}
              {tradeEvaluation && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-4">Evaluation Result</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Approved</p>
                      <p className={`text-xl font-bold ${tradeEvaluation.approved ? 'text-green-400' : 'text-red-400'}`}>
                        {tradeEvaluation.approved ? '✅ Yes' : '❌ No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Confidence</p>
                      <p className="text-xl font-bold text-blue-400">
                        {Math.round(tradeEvaluation.confidence * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Fairness Score</p>
                      <p className="text-xl font-bold text-green-400">
                        {Math.round(tradeEvaluation.fairness_score * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">League Impact</p>
                      <p className={`text-xl font-bold ${getImpactColor(tradeEvaluation.league_impact)}`}>
                        {tradeEvaluation.league_impact}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-400 text-sm">Reasoning</p>
                    <p className="text-white">{tradeEvaluation.reasoning}</p>
                  </div>
                  {tradeEvaluation.recommendations && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm">Recommendations</p>
                      <ul className="list-disc list-inside text-white space-y-1">
                        {tradeEvaluation.recommendations.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rule Suggestions Tab */}
          {activeTab === 'rules' && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-6">📋 Rule Suggestions</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ruleSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-white">{suggestion.title}</h4>
                      <div className="flex gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getImpactColor(suggestion.impact)}`}>
                          {suggestion.impact}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">{suggestion.reasoning}</p>
                    <div className="text-sm text-gray-400">
                      <p><strong>Implementation:</strong> {suggestion.implementation_notes}</p>
                    </div>
                  </div>
                ))}
              </div>

              {ruleSuggestions.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  No rule suggestions available at this time.
                </div>
              )}
            </div>
          )}

          {/* Disputes Tab */}
          {activeTab === 'disputes' && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-6">⚖️ Dispute Resolution</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Dispute Type</label>
                  <select
                    value={disputeData.dispute_type}
                    onChange={(e) => setDisputeData(prev => ({ ...prev, dispute_type: e.target.value }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  >
                    <option value="">Select dispute type</option>
                    <option value="trade_dispute">Trade Dispute</option>
                    <option value="rule_violation">Rule Violation</option>
                    <option value="collusion">Collusion</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Teams Involved (comma-separated IDs)</label>
                  <input
                    type="text"
                    placeholder="123, 456"
                    value={disputeData.teams_involved.join(', ')}
                    onChange={(e) => setDisputeData(prev => ({ 
                      ...prev, 
                      teams_involved: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    }))}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Description</label>
                  <textarea
                    value={disputeData.description}
                    onChange={(e) => setDisputeData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the dispute..."
                    rows={4}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Evidence (optional)</label>
                  <textarea
                    value={disputeData.evidence || ''}
                    onChange={(e) => setDisputeData(prev => ({ ...prev, evidence: e.target.value }))}
                    placeholder="Provide any evidence..."
                    rows={3}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                  />
                </div>
              </div>

              <button
                onClick={handleDisputeResolution}
                disabled={isLoading || !disputeData.dispute_type || !disputeData.description}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-md font-medium transition-colors"
              >
                {isLoading ? 'Resolving...' : 'Resolve Dispute'}
              </button>

              {/* Dispute Resolution Result */}
              {disputeResolution && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h4 className="text-lg font-medium text-white mb-4">Resolution</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm">Recommended Action</p>
                      <p className="text-white font-medium">{disputeResolution.recommended_action}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Confidence</p>
                      <p className="text-xl font-bold text-blue-400">
                        {Math.round(disputeResolution.confidence * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Reasoning</p>
                      <p className="text-white">{disputeResolution.reasoning}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Resolution</p>
                      <p className="text-white">{disputeResolution.resolution}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 