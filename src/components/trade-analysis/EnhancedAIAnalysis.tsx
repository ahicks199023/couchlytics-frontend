'use client'

import React from 'react'

interface RosterComposition {
  before: number
  after: number
  positions_affected: string[]
  depth_changes: Record<string, unknown>
}

interface RiskAnalysis {
  risk_level: 'Low' | 'Medium' | 'High'
  risks: string[]
  value_ratio: number
  recommendations: string[]
}

interface CounterSuggestion {
  type: string
  message: string
  priority: 'low' | 'medium' | 'high'
}

interface PlayerRecommendation {
  position: string
  current_grade: string
  target_grade: string
  message: string
  priority: 'low' | 'medium' | 'high'
}

interface AIAnalysis {
  summary: string
  rosterComposition: RosterComposition
  riskAnalysis: RiskAnalysis
  counterSuggestions: CounterSuggestion[]
  playerRecommendations: PlayerRecommendation[]
}

interface EnhancedAIAnalysisProps {
  aiAnalysis: AIAnalysis
}

const EnhancedAIAnalysis: React.FC<EnhancedAIAnalysisProps> = ({ aiAnalysis }) => {
  const getRiskColor = (riskLevel: string) => {
    switch(riskLevel) {
      case 'Low': return 'text-green-400 bg-green-900/20 border-green-500'
      case 'Medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500'
      case 'High': return 'text-red-400 bg-red-900/20 border-red-500'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500'
    }
  }

  return (
    <div className="ai-analysis bg-gray-800/30 p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4">🧠 Enhanced AI Analysis</h3>
      
      {/* AI Summary */}
      <div className="ai-summary bg-blue-900/20 border border-blue-500 p-4 rounded-lg mb-6">
        <h4 className="text-md font-semibold text-blue-300 mb-2">Analysis Summary</h4>
        <p className="text-sm leading-relaxed">{aiAnalysis.summary}</p>
      </div>

      {/* Roster Composition */}
      <div className="roster-composition mb-6">
        <h4 className="text-md font-semibold mb-3">🏗️ Roster Composition Impact</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/50 p-3 rounded text-center">
            <div className="text-sm text-gray-400">Before Trade</div>
            <div className="text-xl font-bold">{aiAnalysis.rosterComposition.before.toFixed(1)}</div>
          </div>
          <div className="bg-gray-700/50 p-3 rounded text-center">
            <div className="text-sm text-gray-400">After Trade</div>
            <div className="text-xl font-bold text-green-300">
              {aiAnalysis.rosterComposition.after.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="risk-analysis mb-6">
        <h4 className="text-md font-semibold mb-3">⚠️ Risk Analysis</h4>
        <div className={`border p-4 rounded-lg ${getRiskColor(aiAnalysis.riskAnalysis.risk_level)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Risk Level</span>
            <span className="font-bold">{aiAnalysis.riskAnalysis.risk_level}</span>
          </div>
          
          {aiAnalysis.riskAnalysis.risks.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-400 mb-2">Identified Risks:</div>
              <ul className="space-y-1">
                {aiAnalysis.riskAnalysis.risks.map((risk, index) => (
                  <li key={index} className="text-sm">• {risk}</li>
                ))}
              </ul>
            </div>
          )}
          
          {aiAnalysis.riskAnalysis.recommendations.length > 0 && (
            <div className="mt-3">
              <div className="text-sm text-gray-400 mb-2">Risk Mitigation:</div>
              <ul className="space-y-1">
                {aiAnalysis.riskAnalysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Counter Suggestions */}
      {aiAnalysis.counterSuggestions.length > 0 && (
        <div className="counter-suggestions mb-6">
          <h4 className="text-md font-semibold mb-3">💡 Counter Offer Suggestions</h4>
          <div className="space-y-2">
            {aiAnalysis.counterSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-yellow-900/20 border border-yellow-500 p-3 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{suggestion.message}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    suggestion.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                    suggestion.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                    'bg-green-900/50 text-green-300'
                  }`}>
                    {suggestion.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Player Recommendations */}
      {aiAnalysis.playerRecommendations.length > 0 && (
        <div className="player-recommendations">
          <h4 className="text-md font-semibold mb-3">🎯 Player Recommendations</h4>
          <div className="space-y-2">
            {aiAnalysis.playerRecommendations.map((rec, index) => (
              <div key={index} className="bg-green-900/20 border border-green-500 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{rec.position}</span>
                    <span className="text-sm text-gray-400 ml-2">
                      {rec.current_grade} → {rec.target_grade}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                    'bg-blue-900/50 text-blue-300'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mt-1">{rec.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedAIAnalysis
