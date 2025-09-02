'use client'

import React, { useState } from 'react'
import PositionalGradesDisplay from './PositionalGradesDisplay'
import SlidingScaleAdjustments from './SlidingScaleAdjustments'
import EnhancedAIAnalysis from './EnhancedAIAnalysis'
import ItemizationBreakdown from './ItemizationBreakdown'

interface TradeAssessment {
  verdict: string
  team_gives: number
  team_receives: number
  net_gain: number
  confidence: number
  value_ratio: number
}

interface AnalysisResult {
  tradeAssessment: TradeAssessment
  positionalGrades: {
    current: Record<string, unknown>
    afterTrade: Record<string, unknown>
    improvements: Array<{
      position: string
      from: string
      to: string
      ovr_change: number
    }>
    downgrades: Array<{
      position: string
      from: string
      to: string
      ovr_change: number
    }>
  }
  slidingScaleAdjustments: {
    total_adjustments: number
    total_value_increase: number
    adjustments_applied: Array<{
      position: string
      player_name: string
      grade_improvement: string
      adjustment_percentage: number
      base_value: number
      adjusted_value: number
      value_increase: number
    }>
  }
  aiAnalysis: {
    summary: string
    rosterComposition: {
      before: number
      after: number
      positions_affected: string[]
      depth_changes: Record<string, unknown>
    }
    riskAnalysis: {
      risk_level: 'Low' | 'Medium' | 'High'
      risks: string[]
      value_ratio: number
      recommendations: string[]
    }
    counterSuggestions: Array<{
      type: string
      message: string
      priority: 'low' | 'medium' | 'high'
    }>
    playerRecommendations: Array<{
      position: string
      current_grade: string
      target_grade: string
      message: string
      priority: 'low' | 'medium' | 'high'
    }>
  }
  itemizationBreakdown: {
    players_out: Array<{
      name: string
      position: string
      ovr: number
      base_value: number
      enhanced_value: number
      adjustment: number
      adjustment_reason: string
      calculation_method: string
    }>
    players_in: Array<{
      name: string
      position: string
      ovr: number
      base_value: number
      enhanced_value: number
      adjustment: number
      adjustment_reason: string
      calculation_method: string
    }>
    summary: {
      total_base_value_out: number
      total_enhanced_value_out: number
      total_base_value_in: number
      total_enhanced_value_in: number
      net_value_change: number
    }
  }
}

interface AnalysisResultsSectionProps {
  analysisResult: AnalysisResult
}

const AnalysisResultsSection: React.FC<AnalysisResultsSectionProps> = ({ analysisResult }) => {
  const [activeTab, setActiveTab] = useState('overview')
  
  const { 
    tradeAssessment, 
    positionalGrades, 
    slidingScaleAdjustments, 
    aiAnalysis, 
    itemizationBreakdown 
  } = analysisResult

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'grades', label: 'Positional Grades', icon: '📈' },
    { id: 'breakdown', label: 'Itemization', icon: '📋' },
    { id: 'ai', label: 'AI Analysis', icon: '🧠' }
  ]

  return (
    <div className="analysis-results space-y-8">
      {/* Trade Assessment Header */}
      <div className="trade-assessment-header bg-gray-800/50 p-6 rounded-lg">
        <div className="grid grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-sm text-gray-400 mb-1">Verdict</div>
            <div className={`text-2xl font-bold ${
              tradeAssessment.verdict.includes('Win') ? 'text-green-400' :
              tradeAssessment.verdict === 'Fair Trade' ? 'text-blue-400' :
              'text-red-400'
            }`}>
              {tradeAssessment.verdict}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Net Gain/Loss</div>
            <div className={`text-2xl font-bold ${
              tradeAssessment.net_gain >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {tradeAssessment.net_gain >= 0 ? '+' : ''}{tradeAssessment.net_gain.toFixed(1)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Confidence</div>
            <div className="text-2xl font-bold text-blue-400">{tradeAssessment.confidence}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Value Ratio</div>
            <div className="text-2xl font-bold text-purple-400">{tradeAssessment.value_ratio.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="analysis-tabs bg-gray-800/30 p-2 rounded-lg">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Summary */}
            <div className="bg-gray-800/30 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">📊 Trade Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-semibold text-red-300 mb-2">You Give</h4>
                  <div className="text-2xl font-bold">{tradeAssessment.team_gives.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">Total Value</div>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-green-300 mb-2">You Receive</h4>
                  <div className="text-2xl font-bold">{tradeAssessment.team_receives.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">Total Value</div>
                </div>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="bg-gray-800/30 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-4">🎯 Key Highlights</h3>
              <div className="space-y-3">
                {positionalGrades.improvements.length > 0 && (
                  <div className="bg-green-900/20 border border-green-500 p-3 rounded">
                    <div className="font-medium text-green-300">
                      📈 {positionalGrades.improvements.length} Position{positionalGrades.improvements.length > 1 ? 's' : ''} Improved
                    </div>
                    <div className="text-sm text-gray-300">
                      {positionalGrades.improvements.map(imp => `${imp.position}: ${imp.from} → ${imp.to}`).join(', ')}
                    </div>
                  </div>
                )}
                
                {slidingScaleAdjustments.total_adjustments > 0 && (
                  <div className="bg-purple-900/20 border border-purple-500 p-3 rounded">
                    <div className="font-medium text-purple-300">
                      ⚖️ +{slidingScaleAdjustments.total_value_increase.toFixed(1)} Value from Grade Improvements
                    </div>
                    <div className="text-sm text-gray-300">
                      {slidingScaleAdjustments.total_adjustments} adjustment{slidingScaleAdjustments.total_adjustments > 1 ? 's' : ''} applied
                    </div>
                  </div>
                )}

                <div className="bg-blue-900/20 border border-blue-500 p-3 rounded">
                  <div className="font-medium text-blue-300">
                    🧠 AI Risk Assessment: {aiAnalysis.riskAnalysis.risk_level}
                  </div>
                  <div className="text-sm text-gray-300">
                    {aiAnalysis.riskAnalysis.risks.length > 0 
                      ? `${aiAnalysis.riskAnalysis.risks.length} risk${aiAnalysis.riskAnalysis.risks.length > 1 ? 's' : ''} identified`
                      : 'No significant risks identified'
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <PositionalGradesDisplay positionalGrades={positionalGrades} />
        )}

        {activeTab === 'breakdown' && (
          <div className="space-y-6">
            <SlidingScaleAdjustments slidingScaleAdjustments={slidingScaleAdjustments} />
            <ItemizationBreakdown itemizationBreakdown={itemizationBreakdown} />
          </div>
        )}

        {activeTab === 'ai' && (
          <EnhancedAIAnalysis aiAnalysis={aiAnalysis} />
        )}
      </div>
    </div>
  )
}

export default AnalysisResultsSection
