'use client'

import React from 'react'

interface PositionalGrade {
  grade: string
  avg_ovr: number
  players: Array<{
    name: string
    ovr: number
    age: number
    dev_trait: string
  }>
  total_depth: number
}

interface PositionalGrades {
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

interface PositionalGradesDisplayProps {
  positionalGrades: PositionalGrades
}

const PositionalGradesDisplay: React.FC<PositionalGradesDisplayProps> = ({ positionalGrades }) => {
  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'text-green-400 bg-green-900/20 border-green-500'
      case 'B': return 'text-blue-400 bg-blue-900/20 border-blue-500'
      case 'C': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500'
      case 'D': return 'text-orange-400 bg-orange-900/20 border-orange-500'
      case 'F': return 'text-red-400 bg-red-900/20 border-red-500'
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500'
    }
  }

  const getGradeIcon = (grade: string) => {
    switch(grade) {
      case 'A': return '🏆'
      case 'B': return '🥈'
      case 'C': return '🥉'
      case 'D': return '⚠️'
      case 'F': return '❌'
      default: return '❓'
    }
  }

  return (
    <div className="positional-grades bg-gray-800/30 p-6 rounded-lg">
      <h3 className="text-lg font-bold mb-4">📊 Positional Grades Analysis</h3>
      
      {/* Current vs After Trade Comparison */}
      <div className="grades-comparison grid grid-cols-2 gap-6 mb-6">
        <div className="current-grades">
          <h4 className="text-md font-semibold text-gray-300 mb-3">Current Grades</h4>
          <div className="space-y-2">
            {Object.entries(positionalGrades.current).map(([position, data]) => {
              const gradeData = data as PositionalGrade
              return (
                <div key={position} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <span className="text-sm font-medium">{position}</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getGradeColor(gradeData.grade)}`}>
                    {getGradeIcon(gradeData.grade)} {gradeData.grade} ({gradeData.avg_ovr})
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="after-trade-grades">
          <h4 className="text-md font-semibold text-gray-300 mb-3">After Trade</h4>
          <div className="space-y-2">
            {Object.entries(positionalGrades.afterTrade).map(([position, data]) => {
              const gradeData = data as PositionalGrade
              return (
                <div key={position} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <span className="text-sm font-medium">{position}</span>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getGradeColor(gradeData.grade)}`}>
                    {getGradeIcon(gradeData.grade)} {gradeData.grade} ({gradeData.avg_ovr})
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grade Changes */}
      {(positionalGrades.improvements.length > 0 || positionalGrades.downgrades.length > 0) && (
        <div className="grade-changes">
          <h4 className="text-md font-semibold mb-3">Grade Changes</h4>
          
          {positionalGrades.improvements.length > 0 && (
            <div className="improvements mb-4">
              <h5 className="text-green-400 font-medium mb-2">📈 Improvements</h5>
              <div className="space-y-2">
                {positionalGrades.improvements.map((improvement, index) => (
                  <div key={index} className="bg-green-900/20 border border-green-500 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{improvement.position}</span>
                      <span className="text-green-300">
                        {improvement.from} → {improvement.to} (+{improvement.ovr_change} OVR)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {positionalGrades.downgrades.length > 0 && (
            <div className="downgrades">
              <h5 className="text-red-400 font-medium mb-2">📉 Downgrades</h5>
              <div className="space-y-2">
                {positionalGrades.downgrades.map((downgrade, index) => (
                  <div key={index} className="bg-red-900/20 border border-red-500 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{downgrade.position}</span>
                      <span className="text-red-300">
                        {downgrade.from} → {downgrade.to} ({downgrade.ovr_change} OVR)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PositionalGradesDisplay
