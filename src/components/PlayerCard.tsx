import Image from 'next/image'
import { Player } from '@/types/player'

interface PlayerCardProps {
  player: Player
  onAdd?: (player: Player, toGive: boolean) => void
  onRemove?: (playerId: number) => void
  variant?: 'selectable' | 'selected' | 'compact'
  toGive?: boolean
  showValue?: boolean
}

const getHeadshotUrl = (playerName: string, espnId?: string) => {
  if (espnId) {
    return `/headshots/${espnId}.png`
  }
  const sanitized = playerName.toLowerCase().replace(/[^a-z]/g, '')
  return `/headshots/${sanitized}.png`
}

const calculatePlayerValue = (player: Player): number => {
  let baseValue = player.ovr || 75
  
  // Position multipliers
  const positionMultipliers: Record<string, number> = {
    'QB': 1.2,
    'WR': 1.1,
    'HB': 1.0,
    'TE': 0.9,
    'LT': 0.8,
    'LG': 0.7,
    'C': 0.7,
    'RG': 0.7,
    'RT': 0.8,
    'LE': 0.9,
    'RE': 0.9,
    'DT': 0.8,
    'LOLB': 0.9,
    'MLB': 1.0,
    'ROLB': 0.9,
    'CB': 1.0,
    'FS': 0.9,
    'SS': 0.9,
    'K': 0.5,
    'P': 0.4
  }
  
  const multiplier = positionMultipliers[player.position] || 1.0
  
  // Age factor (younger players worth more)
  if (player.age) {
    const ageFactor = Math.max(0.7, 1.0 - (player.age - 22) * 0.02)
    baseValue *= ageFactor
  }
  
  // Development trait bonus
  if (player.devTrait) {
    const devMultipliers: Record<string, number> = {
      'Superstar': 1.3,
      'Star': 1.2,
      'Normal': 1.0,
      'Hidden': 1.1
    }
    baseValue *= devMultipliers[player.devTrait] || 1.0
  }
  
  return Math.round(baseValue * multiplier)
}

const getDevTraitColor = (devTrait?: string) => {
  switch (devTrait) {
    case 'Superstar':
      return 'text-yellow-400'
    case 'Star':
      return 'text-blue-400'
    case 'Hidden':
      return 'text-purple-400'
    default:
      return 'text-gray-400'
  }
}

export default function PlayerCard({ 
  player, 
  onAdd, 
  onRemove, 
  variant = 'selectable', 
  toGive = true,
  showValue = true 
}: PlayerCardProps) {
  const playerValue = calculatePlayerValue(player)
  
  const baseClasses = "flex items-center gap-3 p-3 rounded-lg transition-colors"
  const variantClasses = {
    selectable: "bg-gray-700/50 hover:bg-gray-700 cursor-pointer",
    selected: toGive ? "bg-red-900/30 border border-red-500/30" : "bg-green-900/30 border border-green-500/30",
    compact: "bg-gray-700/30 p-2"
  }

  const handleClick = () => {
    if (variant === 'selectable' && onAdd) {
      onAdd(player, toGive)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove(player.id)
    }
  }

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]}`}
      onClick={handleClick}
    >
      <Image
        src={getHeadshotUrl(player.name, player.espnId)}
        alt={player.name}
        width={variant === 'compact' ? 32 : 40}
        height={variant === 'compact' ? 32 : 40}
        className="rounded-full bg-white flex-shrink-0"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = '/default-avatar.png'
        }}
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium truncate">{player.name}</p>
          {player.devTrait && (
            <span className={`text-xs font-medium ${getDevTraitColor(player.devTrait)}`}>
              {player.devTrait}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">
          {player.position} • {player.team}
          {player.age && ` • ${player.age}yo`}
        </p>
      </div>
      
      <div className="text-right flex-shrink-0">
        <p className="text-neon-green font-bold">{player.ovr}</p>
        <p className="text-gray-400 text-xs">OVR</p>
        {showValue && (
          <p className="text-gray-300 text-xs">Value: {playerValue}</p>
        )}
      </div>
      
      {variant === 'selected' && onRemove && (
        <button
          onClick={handleRemove}
          className={`text-sm font-bold hover:opacity-80 transition-opacity ${
            toGive ? 'text-red-400' : 'text-green-400'
          }`}
        >
          ×
        </button>
      )}
    </div>
  )
} 
