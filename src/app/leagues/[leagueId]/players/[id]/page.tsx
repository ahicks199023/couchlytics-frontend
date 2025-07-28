// src/app/leagues/[leagueId]/players/[playerId]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchFromApi } from '@/lib/api'
import { Player } from '@/types/player'
import TeamLogo from '@/components/TeamLogo'
import GameLogTab from '@/components/GameLogTab'

type TabType = 'ATTRIBUTES' | 'TRAITS' | 'ABILITIES' | 'GAME LOG' | 'CAREER STATS' | 'AWARDS' | 'HISTORY'

export default function PlayerDetailPage() {
  const { leagueId, id: playerId } = useParams()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('ATTRIBUTES')

  useEffect(() => {
    if (!leagueId || leagueId === 'undefined') {
      setError('Invalid or missing league ID.')
      return
    }
    setLoading(true)
    console.log('Fetching player details for:', { leagueId, playerId })
    
    console.log(`[PlayerDetail] Fetching player ${playerId} from league ${leagueId}`)
    fetchFromApi(`/leagues/${leagueId}/players/${playerId}`)
      .then((data) => {
        console.log('Player data received:', data)
        const playerData = data as Record<string, unknown>
        console.log('Player data keys:', Object.keys(playerData))
        console.log('Player data structure:', JSON.stringify(playerData, null, 2))
        
        // Debug: Log all fields that might contain ratings
        const ratingFields = Object.keys(playerData).filter(key => 
          key.toLowerCase().includes('rating') || 
          key.toLowerCase().includes('speed') || 
          key.toLowerCase().includes('accel') || 
          key.toLowerCase().includes('agility') || 
          key.toLowerCase().includes('strength') ||
          key.toLowerCase().includes('aware') ||
          key.toLowerCase().includes('jump') ||
          key.toLowerCase().includes('stamina') ||
          key.toLowerCase().includes('toughness') ||
          key.toLowerCase().includes('injury') ||
          key.toLowerCase().includes('throw') ||
          key.toLowerCase().includes('accuracy') ||
          key.toLowerCase().includes('catch') ||
          key.toLowerCase().includes('block') ||
          key.toLowerCase().includes('tackle') ||
          key.toLowerCase().includes('power') ||
          key.toLowerCase().includes('finesse') ||
          key.toLowerCase().includes('cover') ||
          key.toLowerCase().includes('kick')
        )
        console.log('Potential rating fields found:', ratingFields)
        ratingFields.forEach(field => {
          console.log(`${field}:`, playerData[field])
        })
        
        // Also log ALL fields to see what's actually available
        console.log('ALL available fields:', Object.keys(playerData))
        console.log('Field values that are numbers:', Object.entries(playerData).filter(([, value]) => typeof value === 'number').map(([key, value]) => `${key}: ${value}`))
        
                            // Map the API response to our Player interface using actual API field names
                    const mappedPlayer = {
                      ...playerData,
                      // Required fields
                      id: playerData.id,
                      name: playerData.name,
                      team: playerData.teamName,
                      position: playerData.position,
                      // Basic info
                      teamName: playerData.teamName,
                      ovr: playerData.overall,
                      
                      // Core Attributes - using actual API field names
                      speedRating: playerData.speed,
                      accelerationRating: playerData.acceleration,
                      agilityRating: playerData.agility,
                      strengthRating: playerData.strength,
                      awareRating: playerData.awareness,
                      jumpRating: playerData.jumping,
                      staminaRating: playerData.stamina,
                      toughnessRating: playerData.toughness,
                      injuryRating: playerData.injury,
                      
                      // Passing Attributes - using actual API field names
                      throwPowerRating: playerData.throwPower,
                      shortAccuracyRating: playerData.shortAccuracy,
                      midAccuracyRating: playerData.midAccuracy,
                      deepAccuracyRating: playerData.deepAccuracy,
                      throwOnRunRating: playerData.throwOnRun,
                      playActionRating: playerData.playAction,
                      breakSackRating: playerData.breakSack,
                      underPressureRating: playerData.underPressure,
                      
                      // Rushing Attributes - using actual API field names
                      carryRating: playerData.carrying,
                      changeOfDirectionRating: playerData.changeOfDirection,
                      spinMoveRating: playerData.spinMove,
                      jukeMoveRating: playerData.jukeMove,
                      breakTackleRating: playerData.breakTackle,
                      ballCarryVisionRating: playerData.ballCarrierVision,
                      truckingRating: playerData.trucking,
                      stiffArmRating: playerData.stiffArm,
                      
                      // Receiving Attributes - using actual API field names
                      catchRating: playerData.catching,
                      specCatchRating: playerData.spectacularCatch,
                      releaseRating: playerData.release,
                      catchInTrafficRating: playerData.catchInTraffic,
                      routeRunShortRating: playerData.routeRunShort,
                      medRouteRunRating: playerData.routeRunMedium,
                      deepRouteRunRating: playerData.routeRunDeep,
                      kickReturnRating: playerData.kickReturn,
                      
                      // Blocking Attributes - using actual API field names
                      passBlockRating: playerData.passBlock,
                      passBlockPowerRating: playerData.passBlockPower,
                      passBlockFinesseRating: playerData.passBlockFinesse,
                      runBlockRating: playerData.runBlock,
                      runBlockPowerRating: playerData.runBlockPower,
                      runBlockFinesseRating: playerData.runBlockFinesse,
                      leadBlockRating: playerData.leadBlock,
                      impactBlockRating: playerData.impactBlock,
                      
                      // Defense Attributes - using actual API field names
                      tackleRating: playerData.tackle,
                      hitPowerRating: playerData.hitPower,
                      pursuitRating: playerData.pursuit,
                      playRecognitionRating: playerData.playRecognition,
                      blockShedRating: playerData.blockShedding,
                      finesseMovesRating: playerData.finesseMoves,
                      powerMovesRating: playerData.powerMoves,
                      manCoverRating: playerData.manCoverage,
                      zoneCoverRating: playerData.zoneCoverage,
                      pressRating: playerData.press,
                      
                      // Kicking Attributes - using actual API field names
                      kickPowerRating: playerData.kickPower,
                      kickAccuracyRating: playerData.kickAccuracy,
                      
                      // Contract & Trade - using actual API field names
                      capHit: playerData.capHit,
                      salary: playerData.salary,
                      bonus: playerData.bonus,
                      yearsLeft: playerData.yearsLeft,
                      contractLength: playerData.contractLength,
                      releaseNetSavings: playerData.releaseNetSavings,
                      totalReleasePenalty: playerData.totalReleasePenalty,
                      
                      // Additional player details - using actual API field names
                      jerseyNumber: playerData.jerseyNumber,
                      yearsPro: playerData.yearsPro,
                      rookieYear: playerData.rookieYear,
                      draftRound: playerData.draftRound,
                      draftPick: playerData.draftPick,
                      college: playerData.college,
                      height: playerData.height,
                      weight: playerData.weight,
                      birthDay: playerData.birthDay,
                      birthMonth: playerData.birthMonth,
                      birthYear: playerData.birthYear,
                      hometown: playerData.hometown,
                      homeState: playerData.homeState,
                      age: playerData.age,
                      devTrait: playerData.devTrait,
                      durabilityRating: playerData.durabilityRating,
                      experiencePoints: playerData.experiencePoints,
                      skillPoints: playerData.skillPoints,
                      legacyScore: playerData.legacyScore,
                      isFreeAgent: playerData.isFreeAgent,
                      isOnIr: playerData.isOnIr,
                      isOnPracticeSquad: playerData.isOnPracticeSquad,
                      isActive: playerData.isActive,
                      reSignStatus: playerData.reSignStatus,
                      desiredLength: playerData.desiredLength,
                      headshotUrl: playerData.headshotUrl,
                      headshotSource: playerData.headshotSource,
                      headshotConfidence: playerData.headshotConfidence,
                      fullName: playerData.fullName,
                    } as Player
        
                 console.log('Mapped player data:', mappedPlayer)
         
         // Log what we actually have vs what we need
         console.log('=== API DATA ANALYSIS ===')
         console.log('Fields provided by API:', Object.keys(playerData))
         console.log('Fields we need for full player profile:')
         console.log('- Core: speed, acceleration, agility, strength, awareness, jumping, stamina, toughness, injury')
         console.log('- Passing: throwPower, shortAccuracy, midAccuracy, deepAccuracy, throwOnRun, playAction, breakSack, underPressure')
         console.log('- Rushing: carrying, changeOfDirection, spinMove, jukeMove, breakTackle, ballCarrierVision, trucking, stiffArm')
         console.log('- Receiving: catching, spectacularCatch, release, catchInTraffic, routeRunShort, routeRunMedium, routeRunDeep, kickReturn')
         console.log('- Blocking: passBlock, passBlockPower, passBlockFinesse, runBlock, runBlockPower, runBlockFinesse, leadBlock, impactBlock')
         console.log('- Defense: tackle, hitPower, pursuit, playRecognition, blockShedding, finesseMoves, powerMoves, manCoverage, zoneCoverage, press')
         console.log('- Kicking: kickPower, kickAccuracy')
         console.log('- Contract: capHit, salary, bonus, yearsLeft, contractLength, releaseNetSavings, totalReleasePenalty')
         console.log('')
         console.log('RECOMMENDATION: Update backend API endpoint to return all rating fields from database')
         
         setPlayer(mappedPlayer)
      })
      .catch((err) => {
        console.error('[PlayerDetail] Failed to load player:', err)
        console.error('[PlayerDetail] Error details:', {
          leagueId,
          playerId,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        })
        setError(`Failed to load player (ID: ${playerId}). Player may not exist in this league.`)
      })
      .finally(() => setLoading(false))
  }, [leagueId, playerId])

  const formatHeight = (height?: number) => {
    if (!height) return '-'
    const feet = Math.floor(height / 12)
    const inches = height % 12
    return `${feet}'${inches}"`
  }

  const formatWeight = (weight?: number) => {
    if (!weight) return '-'
    return `${weight} lbs`
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount / 1000000) + 'M'
  }

  const getAttributeColor = (value?: number) => {
    if (!value) return 'text-gray-400'
    if (value >= 90) return 'text-yellow-400'
    if (value >= 80) return 'text-green-400'
    if (value >= 70) return 'text-blue-400'
    if (value >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const renderAttribute = (label: string, value?: number) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-300 text-sm">{label}:</span>
      <span className={`font-bold ${getAttributeColor(value)}`}>{value || '-'}</span>
    </div>
  )

  const renderAttributeSection = (title: string, attributes: { label: string; value?: number }[]) => (
    <div className="mb-6">
      <h4 className="text-blue-400 font-semibold mb-2 text-sm uppercase tracking-wide">{title}</h4>
      <div className="space-y-1">
        {attributes.map((attr) => renderAttribute(attr.label, attr.value))}
      </div>
    </div>
  )

  if (error) return (
    <main className="min-h-screen bg-black text-white p-6">
      <Link href={`/leagues/${leagueId}/players`} className="text-blue-400 hover:underline mb-4 block">
        ← Back to Players
      </Link>
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h2 className="text-red-400 font-semibold mb-2">Player Not Found</h2>
        <p className="text-red-300">{error}</p>
        <p className="text-gray-400 mt-2">The player ID &quot;{playerId}&quot; may not exist in this league.</p>
      </div>
    </main>
  )

  if (loading) return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading player details...</div>
      </div>
    </main>
  )

  if (!player) return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="text-red-400">No player data found.</div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black text-white p-6">
      {/* Navigation */}
      <div className="mb-6">
        <Link href={`/leagues/${leagueId}/players`} className="text-blue-400 hover:underline">
          ← Back to Players
        </Link>
        <span className="text-gray-400 mx-2">/</span>
        <span className="text-white">{player.name}</span>
      </div>

      {/* Top Section - Player Card and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Player Card */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <div className="flex items-start space-x-4">
            {/* Player Image Placeholder */}
            <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">Photo</span>
            </div>
            
            <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
              <TeamLogo teamName={player.teamName} size="md" />
              {player.tradeBlocked && (
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
              )}
            </div>
              
              <div className="text-sm text-gray-400 mb-1">
                {player.position} #{player.jerseyNumber || '--'}
              </div>
              
              <h1 className="text-2xl font-bold mb-2">{player.name}</h1>
              
              <div className="text-4xl font-bold text-yellow-400">
                Overall: {player.ovr || '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-blue-400 font-semibold mb-4">Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated:</span>
              <span className="text-white">{player.lastUpdated || '3 months ago'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Age:</span>
              <span className="text-white">{player.age || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">HT/WT:</span>
              <span className="text-white">{formatHeight(player.height)} / {formatWeight(player.weight)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Scheme:</span>
              <span className="text-white">{player.scheme || 'Base 3-4'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Years Pro:</span>
              <span className="text-white">{player.yearsPro || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rookie Year:</span>
              <span className="text-white">{player.rookieYear || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Draft:</span>
              <span className="text-white">
                {player.draftRound && player.draftPick ? `Rd ${player.draftRound}, Pick ${player.draftPick}` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">College:</span>
              <span className="text-white">{player.college || '--'}</span>
            </div>
          </div>
        </div>

        {/* Trade Information */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-blue-400 font-semibold mb-4">Trade Information</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Off The Block</span>
              <div className={`w-12 h-6 rounded-full transition-colors ${player.tradeBlocked ? 'bg-red-500' : 'bg-gray-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${player.tradeBlocked ? 'translate-x-6' : 'translate-x-1'} mt-0.5`}></div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Value:</span>
                <span className="text-white">{player.tradeValue || '--'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recommended:</span>
                <span className="text-white">{player.recommendedTrade || '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Key Attributes and Contract */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Key Attributes */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-blue-400 font-semibold mb-4">Key Attributes</h3>
          <div className="grid grid-cols-2 gap-4">
            {renderAttribute('Speed', player.speedRating)}
            {renderAttribute('Acceleration', player.accelerationRating)}
            {renderAttribute('Agility', player.agilityRating)}
            {renderAttribute('Strength', player.strengthRating)}
            {renderAttribute('Awareness', player.awareRating)}
            {renderAttribute('Play Recognition', player.playRecognitionRating)}
            {renderAttribute('Tackle', player.tackleRating)}
            {renderAttribute('Block Shed', player.blockShedRating)}
            {renderAttribute('Power Moves', player.powerMovesRating)}
            {renderAttribute('Finesse Moves', player.finesseMovesRating)}
          </div>
        </div>

        {/* Contract */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
          <h3 className="text-blue-400 font-semibold mb-4">Contract</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Cap Hit:</span>
              <span className="text-white">{formatCurrency(player.capHit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Salary:</span>
              <span className="text-white">{formatCurrency(player.salary)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bonus:</span>
              <span className="text-white">{formatCurrency(player.bonus)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Years Left/Length:</span>
              <span className="text-white">{player.yearsLeft || '--'}/{player.contractLength || '--'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Release Net Savings:</span>
              <span className="text-white">{formatCurrency(player.releaseNetSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Release Penalty:</span>
              <span className="text-white">{formatCurrency(player.totalReleasePenalty)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">2026 Year Penalty:</span>
              <span className="text-white">{formatCurrency(player.releasePenalty2026)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">2027 Year Penalty:</span>
              <span className="text-white">{formatCurrency(player.releasePenalty2027)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Tabs and Detailed Attributes */}
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {(['ATTRIBUTES', 'TRAITS', 'ABILITIES', 'GAME LOG', 'CAREER STATS', 'AWARDS', 'HISTORY'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'ATTRIBUTES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderAttributeSection('CORE', [
                { label: 'Speed', value: player.speedRating },
                { label: 'Acceleration', value: player.accelerationRating },
                { label: 'Agility', value: player.agilityRating },
                { label: 'Strength', value: player.strengthRating },
                { label: 'Awareness', value: player.awareRating },
                { label: 'Jump', value: player.jumpRating },
                { label: 'Stamina', value: player.staminaRating },
                { label: 'Toughness', value: player.toughnessRating },
                { label: 'Injury', value: player.injuryRating },
              ])}

              {renderAttributeSection('PASSING', [
                { label: 'Throw Power', value: player.throwPowerRating },
                { label: 'Short Accuracy', value: player.shortAccuracyRating },
                { label: 'Mid Accuracy', value: player.midAccuracyRating },
                { label: 'Deep Accuracy', value: player.deepAccuracyRating },
                { label: 'Throw On The Run', value: player.throwOnRunRating },
                { label: 'Play Action', value: player.playActionRating },
                { label: 'Break Sack', value: player.breakSackRating },
                { label: 'Under Pressure', value: player.underPressureRating },
              ])}

              {renderAttributeSection('RUSHING', [
                { label: 'Carry', value: player.carryRating },
                { label: 'Change of Direction', value: player.changeOfDirectionRating },
                { label: 'Spin Move', value: player.spinMoveRating },
                { label: 'Juke Move', value: player.jukeMoveRating },
                { label: 'Break Tackle', value: player.breakTackleRating },
                { label: 'Ball Carry Vision', value: player.ballCarryVisionRating },
                { label: 'Trucking', value: player.truckingRating },
                { label: 'Stiff Arm', value: player.stiffArmRating },
              ])}

              {renderAttributeSection('RECEIVING', [
                { label: 'Catch', value: player.catchRating },
                { label: 'Spectacular Catch', value: player.specCatchRating },
                { label: 'Release', value: player.releaseRating },
                { label: 'Catch In Traffic', value: player.catchInTrafficRating },
                { label: 'Short Route Running', value: player.routeRunShortRating },
                { label: 'Med Route Running', value: player.medRouteRunRating },
                { label: 'Deep Route Running', value: player.deepRouteRunRating },
                { label: 'Kick Return', value: player.kickReturnRating },
              ])}

              {renderAttributeSection('BLOCKING', [
                { label: 'Pass Block', value: player.passBlockRating },
                { label: 'Pass Block Power', value: player.passBlockPowerRating },
                { label: 'Pass Block Finesse', value: player.passBlockFinesseRating },
                { label: 'Run Block', value: player.runBlockRating },
                { label: 'Run Block Power', value: player.runBlockPowerRating },
                { label: 'Run Block Finesse', value: player.runBlockFinesseRating },
                { label: 'Lead Block', value: player.leadBlockRating },
                { label: 'Impact Block', value: player.impactBlockRating },
              ])}

              {renderAttributeSection('DEFENSE', [
                { label: 'Tackle', value: player.tackleRating },
                { label: 'Hit Power', value: player.hitPowerRating },
                { label: 'Pursuit', value: player.pursuitRating },
                { label: 'Play Recognition', value: player.playRecognitionRating },
                { label: 'Block Shedding', value: player.blockShedRating },
                { label: 'Finesse Moves', value: player.finesseMovesRating },
                { label: 'Power Moves', value: player.powerMovesRating },
                { label: 'Man Coverage', value: player.manCoverRating },
                { label: 'Zone Coverage', value: player.zoneCoverRating },
                { label: 'Press', value: player.pressRating },
              ])}

              {renderAttributeSection('KICKING', [
                { label: 'Kick Power', value: player.kickPowerRating },
                { label: 'Kick Accuracy', value: player.kickAccuracyRating },
              ])}
            </div>
          )}

          {activeTab === 'TRAITS' && (
            <div className="space-y-4">
              <h4 className="text-blue-400 font-semibold mb-4">Player Traits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${player.clutchTrait ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <span className="text-white">Clutch</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${player.highMotorTrait ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <span className="text-white">High Motor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${player.bigHitTrait ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <span className="text-white">Big Hitter</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded ${player.stripBallTrait ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <span className="text-white">Strip Ball</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ABILITIES' && (
            <div className="text-center py-8">
              <p className="text-gray-400">Abilities data not available</p>
            </div>
          )}

                     {activeTab === 'GAME LOG' && (
             <GameLogTab playerId={playerId as string} leagueId={leagueId as string} />
           )}

          {activeTab === 'CAREER STATS' && (
            <div className="text-center py-8">
              <p className="text-gray-400">Career stats data not available</p>
            </div>
          )}

          {activeTab === 'AWARDS' && (
            <div className="text-center py-8">
              <p className="text-gray-400">Awards data not available</p>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="text-center py-8">
              <p className="text-gray-400">History data not available</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
