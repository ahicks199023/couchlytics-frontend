'use client'

import React from 'react'
import Image from 'next/image'

interface PlayerRatings {
  speed?: number
  acceleration?: number
  agility?: number
  awareness?: number
  strength?: number
  jumping?: number
  stamina?: number
  injury?: number
  toughness?: number
  // QB specific
  throw_power?: number
  throw_accuracy_short?: number
  throw_accuracy_medium?: number
  throw_accuracy_deep?: number
  throw_on_run?: number
  throw_under_pressure?: number
  play_action?: number
  play_recognition?: number
  // RB specific
  carrying?: number
  break_tackle?: number
  trucking?: number
  juke_move?: number
  spin_move?: number
  stiff_arm?: number
  ball_carrier_vision?: number
  // WR specific
  catching?: number
  catch_in_traffic?: number
  spectacular_catch?: number
  route_running?: number
  release?: number
  // Defense specific
  tackle?: number
  hit_power?: number
  pursuit?: number
  block_shedding?: number
  power_moves?: number
  finesse_moves?: number
  man_coverage?: number
  zone_coverage?: number
  press?: number
  change_of_direction?: number
  // Special teams
  kick_power?: number
  kick_accuracy?: number
  kick_return?: number
}

interface PlayerDetails {
  id: number
  playerName: string
  position: string
  team?: string
  overall_rating?: number
  age?: number
  height?: number
  weight?: number
  college?: string
  jersey_number?: number
  dev_trait?: string
  years_pro?: number
  contract_years_left?: number
  contract_salary?: number
  contract_bonus?: number
  cap_hit?: number
  headshot_url?: string
  player_card_url?: string
  player_profile_url?: string
  ratings?: PlayerRatings
  player_value?: number
  position_rank?: number
  overall_rank?: number
}

interface PlayerDetailsPopupProps {
  player: PlayerDetails | null
  isOpen: boolean
  onClose: () => void
}

const PlayerDetailsPopup: React.FC<PlayerDetailsPopupProps> = ({ player, isOpen, onClose }) => {
  if (!isOpen || !player) return null

  const getHeadshotUrl = () => {
    if (player.headshot_url) {
      return player.headshot_url
    }
    // Fallback to default headshot URL pattern
    return `https://example.com/headshots/${player.id}.jpg`
  }

  const getKeyAttributes = (player: PlayerDetails) => {
    const attributes: Record<string, number> = {}
    
    if (player.ratings) {
      // Position-specific key attributes
      switch (player.position) {
        case 'QB':
          if (player.ratings.throw_power) attributes['Throw Power'] = player.ratings.throw_power
          if (player.ratings.throw_accuracy_short) attributes['Short Accuracy'] = player.ratings.throw_accuracy_short
          if (player.ratings.awareness) attributes['Awareness'] = player.ratings.awareness
          break
        case 'RB':
          if (player.ratings.carrying) attributes['Carrying'] = player.ratings.carrying
          if (player.ratings.break_tackle) attributes['Break Tackle'] = player.ratings.break_tackle
          if (player.ratings.speed) attributes['Speed'] = player.ratings.speed
          break
        case 'WR':
        case 'TE':
          if (player.ratings.catching) attributes['Catching'] = player.ratings.catching
          if (player.ratings.speed) attributes['Speed'] = player.ratings.speed
          if (player.ratings.route_running) attributes['Route Running'] = player.ratings.route_running
          break
        default:
          // General attributes for other positions
          if (player.ratings.speed) attributes['Speed'] = player.ratings.speed
          if (player.ratings.awareness) attributes['Awareness'] = player.ratings.awareness
          if (player.ratings.strength) attributes['Strength'] = player.ratings.strength
      }
    }
    
    return attributes
  }

  const getPlayerValueBreakdown = (player: PlayerDetails) => {
    const baseValue = player.overall_rating || 75
    const positionMultiplier = 1.0 // Could be calculated based on position
    const ageFactor = player.age ? (player.age < 25 ? 1.2 : player.age > 30 ? 0.8 : 1.0) : 1.0
    const devFactor = player.dev_trait === 'Superstar' ? 1.3 : player.dev_trait === 'Star' ? 1.1 : 1.0
    
    const finalValue = Math.round(baseValue * positionMultiplier * ageFactor * devFactor)
    
    return {
      baseValue,
      positionMultiplier,
      ageFactor,
      devFactor,
      finalValue
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Player Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Player Header */}
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={getHeadshotUrl()}
            alt={player.playerName}
            width={64}
            height={64}
            className="rounded-full bg-white"
            onError={(e) => {
              e.currentTarget.src = '/default-player.png'
            }}
          />
          <div>
            <h4 className="text-lg font-bold text-white">{player.playerName}</h4>
            <p className="text-gray-400">{player.position} • {player.team} • #{player.jersey_number}</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Age</p>
            <p className="text-white font-semibold">{player.age || 'N/A'}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Years Pro</p>
            <p className="text-white font-semibold">{player.years_pro || 'N/A'}</p>
          </div>
        </div>

        {/* Position and Team */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Position</p>
            <p className="text-white font-semibold">{player.position}</p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Team</p>
            <p className="text-white font-semibold">{player.team}</p>
          </div>
        </div>

        {/* Key Attributes */}
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-white mb-3">Key Attributes</h5>
          <div className="space-y-2">
            {Object.entries(getKeyAttributes(player)).map(([attr, value]) => (
              <div key={attr} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                <span className="text-gray-300">{attr}</span>
                <span className="text-green-400 font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player Value Breakdown */}
        <div className="mb-6">
          <h5 className="text-lg font-semibold text-white mb-3">Player Value Breakdown</h5>
          <div className="space-y-2">
            {(() => {
              const breakdown = getPlayerValueBreakdown(player)
              return (
                <>
                  <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span className="text-gray-300">Base Value</span>
                    <span className="text-white font-bold">{breakdown.baseValue}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span className="text-gray-300">Position Multiplier</span>
                    <span className="text-white font-bold">×{breakdown.positionMultiplier}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span className="text-gray-300">Age Factor</span>
                    <span className="text-white font-bold">×{breakdown.ageFactor}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span className="text-gray-300">Development</span>
                    <span className="text-white font-bold">×{breakdown.devFactor}</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-600 p-2 rounded border border-blue-400">
                    <span className="text-white font-bold">Final Value</span>
                    <span className="text-white font-bold text-xl">{breakdown.finalValue}</span>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="bg-green-500 text-white px-6 py-2 rounded font-semibold hover:bg-green-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlayerDetailsPopup
