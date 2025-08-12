'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import TeamBadge from '@/components/TeamBadge'

interface Column {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  formatter?: (value: unknown) => string
}

interface StatsTableProps {
  title: string
  columns: Column[]
  data: Record<string, unknown>[]
  loading?: boolean
  error?: string | null
  leagueId: string
  onRowClick?: (row: Record<string, unknown>) => void
  highlightUserTeam?: boolean
  currentTeamId?: number | null
}

export function StatsTable({
  title,
  columns,
  data,
  loading = false,
  error = null,
  leagueId,
  onRowClick,
  highlightUserTeam = false,
  currentTeamId = null,
}: StatsTableProps) {
  const router = useRouter()
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const sortedData = useMemo(() => {
    if (!sortColumn) return data
    
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aString = String(aValue || '').toLowerCase()
      const bString = String(bValue || '').toLowerCase()

      if (sortDirection === 'asc') {
        return aString.localeCompare(bString)
      } else {
        return bString.localeCompare(aString)
      }
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('desc')
    }
  }

  const handlePlayerClick = (player: Record<string, unknown>) => {
    console.log('=== handlePlayerClick called ===')
    console.log('Player object:', player)
    console.log('onRowClick exists:', !!onRowClick)
    
    if (onRowClick) {
      console.log('Calling onRowClick...')
      onRowClick(player)
    } else if (player.maddenId || player.playerId) {
      const idToUse = player.maddenId || player.playerId
      router.push(`/leagues/${leagueId}/players/${idToUse}`)
    }
  }

  const formatNumber = (value: number): string => {
    if (value === null || value === undefined) return '-'
    return value.toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center py-4">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-4">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-center py-3 px-2 font-medium text-gray-900 dark:text-white">
                  Rank
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'py-3 px-2 font-medium text-gray-900 dark:text-white text-center',
                      column.sortable && 'cursor-pointer hover:bg-neon-green/10 dark:hover:bg-neon-green/20 transition-colors'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-center">
                      <span>{column.label}</span>
                      {column.sortable && sortColumn === column.key && (
                        <span className="ml-1 text-neon-green">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, index) => {
                const isUserTeam = highlightUserTeam && currentTeamId && (row.teamId as number) === currentTeamId
                
                return (
                  <tr
                    key={index}
                    className={cn(
                      'border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      isUserTeam && 'bg-yellow-50 dark:bg-yellow-900/20 font-semibold',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick && handlePlayerClick(row)}
                  >
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 text-center">
                      {index + 1}
                    </td>
                    {columns.map((column) => {
                      const value = row[column.key]
                      let displayValue: string | number = String(value || '')

                      if (column.formatter) {
                        displayValue = column.formatter(value)
                      } else if (typeof value === 'number') {
                        displayValue = formatNumber(value)
                      }

                      return (
                        <td
                          key={column.key}
                          className="py-3 px-2 text-center"
                        >
                          {column.key === 'name' && row.espnId ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Image
                                src={`/headshots/${row.espnId as string}.png`}
                                alt={row.name as string}
                                width={32}
                                height={32}
                                className="rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = '/default-avatar.png'
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePlayerClick(row)
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-neon-green transition-colors font-medium"
                              >
                                {displayValue}
                              </button>
                            </div>
                          ) : column.key === 'name' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePlayerClick(row)
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-neon-green transition-colors font-medium"
                            >
                              {displayValue}
                            </button>
                          ) : column.key === 'team_name' || column.key === 'teamName' ? (
                            <div className="flex justify-center">
                              {(() => {
                                const slotNum = (row.team_id as number) || (row.teamId as number)
                                const nameForLookup = typeof slotNum === 'number' && Number.isFinite(slotNum)
                                  ? `team ${slotNum}`
                                  : (displayValue as string)
                                return (
                                  <TeamBadge
                                    teamName={nameForLookup}
                                    size="lg"
                                    variant="logo"
                                    showAbbr={false}
                                    leagueId={leagueId}
                                    linkToTeam={true}
                                  />
                                )
                              })()}
                            </div>
                          ) : (
                            displayValue
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 