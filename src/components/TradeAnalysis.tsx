import React from 'react'
import { CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TradeResult } from '../types/player'

interface TradeAnalysisProps {
  result: TradeResult
}

const getVerdictColor = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return 'text-green-400'
    case 'fair':
    case 'balanced':
      return 'text-yellow-400'
    case 'you lose':
    case 'poor':
      return 'text-red-400'
    default:
      return 'text-gray-400'
  }
}

const getVerdictIcon = (verdict: string) => {
  switch (verdict.toLowerCase()) {
    case 'you win':
    case 'excellent':
      return <CheckCircle className="w-6 h-6 text-green-400" />
    case 'fair':
    case 'balanced':
      return <AlertCircle className="w-6 h-6 text-yellow-400" />
    case 'you lose':
    case 'poor':
      return <XCircle className="w-6 h-6 text-red-400" />
    default:
      return null
  }
}

const getNetGainIcon = (netGain: number) => {
  if (netGain > 0) {
    return <TrendingUp className="w-4 h-4 text-green-400" />
  } else if (netGain < 0) {
    return <TrendingDown className="w-4 h-4 text-red-400" />
  } else {
    return <Minus className="w-4 h-4 text-gray-400" />
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return 'text-green-400'
  if (confidence >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export default function TradeAnalysis({ result }: TradeAnalysisProps) {
  const { tradeAssessment, canAutoApprove, reasoning } = result

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-600">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {getVerdictIcon(tradeAssessment.verdict)}
        <div>
          <h3 className="text-xl font-bold text-white">
            Trade Analysis Results
          </h3>
          <p className="text-gray-400 text-sm">
            AI-powered evaluation of your trade proposal
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white text-lg">Assessment</h4>
          
          <div className="space-y-3">
            {/* Verdict */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-300">Verdict:</span>
              <div className="flex items-center gap-2">
                {getVerdictIcon(tradeAssessment.verdict)}
                <span className={`font-bold text-lg ${getVerdictColor(tradeAssessment.verdict)}`}>
                  {tradeAssessment.verdict}
                </span>
              </div>
            </div>

            {/* Team Gives */}
            <div className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-500/30">
              <span className="text-gray-300">Team Gives:</span>
              <span className="text-white font-semibold">{tradeAssessment.teamGives}</span>
            </div>

            {/* Team Receives */}
            <div className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <span className="text-gray-300">Team Receives:</span>
              <span className="text-white font-semibold">{tradeAssessment.teamReceives}</span>
            </div>

            {/* Net Gain */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-300">Net Gain:</span>
              <div className="flex items-center gap-2">
                {getNetGainIcon(tradeAssessment.netGain)}
                <span className={`font-bold text-lg ${
                  tradeAssessment.netGain >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {tradeAssessment.netGain >= 0 ? '+' : ''}{tradeAssessment.netGain}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-300">Confidence:</span>
              <span className={`font-semibold ${getConfidenceColor(tradeAssessment.confidence)}`}>
                {tradeAssessment.confidence}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Details */}
        <div className="space-y-4">
          <h4 className="font-semibold text-white text-lg">Details</h4>
          
          <div className="space-y-3">
            {/* Auto-Approve */}
            <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <span className="text-gray-300">Auto-Approve:</span>
              <div className="flex items-center gap-2">
                {canAutoApprove ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={canAutoApprove ? 'text-green-400' : 'text-red-400'}>
                  {canAutoApprove ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Reasoning */}
            {reasoning && (
              <div className="p-3 bg-gray-700/30 rounded-lg">
                <p className="text-gray-300 text-sm mb-2 font-medium">AI Reasoning:</p>
                <p className="text-white text-sm leading-relaxed">{reasoning}</p>
              </div>
            )}

            {/* Trade Summary */}
            <div className="p-3 bg-gray-700/30 rounded-lg">
              <p className="text-gray-300 text-sm mb-2 font-medium">Summary:</p>
              <div className="space-y-1 text-sm">
                <p className="text-white">
                  This trade is considered <span className={getVerdictColor(tradeAssessment.verdict)}>
                    {tradeAssessment.verdict.toLowerCase()}
                  </span> with {tradeAssessment.confidence}% confidence.
                </p>
                {tradeAssessment.netGain !== 0 && (
                  <p className="text-gray-300">
                    You {tradeAssessment.netGain > 0 ? 'gain' : 'lose'} {Math.abs(tradeAssessment.netGain)} points in value.
                  </p>
                )}
                {canAutoApprove && (
                  <p className="text-green-400 font-medium">
                    ✓ This trade meets auto-approval criteria
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="font-semibold text-blue-400 mb-2">Recommendations</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          {tradeAssessment.verdict.toLowerCase().includes('win') && (
            <li>• This trade appears favorable for your team</li>
          )}
          {tradeAssessment.verdict.toLowerCase().includes('lose') && (
            <li>• Consider negotiating for additional value</li>
          )}
          {tradeAssessment.verdict.toLowerCase().includes('fair') && (
            <li>• This is a balanced trade that benefits both teams</li>
          )}
          {tradeAssessment.confidence < 70 && (
            <li>• Consider getting a second opinion due to low confidence</li>
          )}
          {canAutoApprove && (
            <li>• This trade can be processed immediately</li>
          )}
        </ul>
      </div>
    </div>
  )
} 
