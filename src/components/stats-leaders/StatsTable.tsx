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
    console.log('StatsTable: Received data:', data)
    console.log('StatsTable: Data length:', data.length)
    if (data.length > 0) {
      console.log('StatsTable: First row sample:', data[0])
      console.log('StatsTable: Available fields:', Object.keys(data[0]))
      console.log('StatsTable: Team name value:', data[0].team_name)
      console.log('StatsTable: Team name type:', typeof data[0].team_name)
      // Check for any team-related fields
      const teamFields = Object.keys(data[0]).filter(key => key.toLowerCase().includes('team'))
      console.log('StatsTable: Team-related fields:', teamFields)
      teamFields.forEach(field => {
        console.log(`StatsTable: ${field} value:`, data[0][field])
      })
    }
    
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
    if (onRowClick) {
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                      'py-3 px-2 font-medium text-gray-900 dark:text-white',
                      column.sortable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      !column.align && 'text-center'
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.label}</span>
                      {column.sortable && sortColumn === column.key && (
                        <span className="ml-1">
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
                            className={cn(
                              'py-3 px-2',
                              column.align === 'right' && 'text-right',
                              column.align === 'center' && 'text-center',
                              !column.align && 'text-center'
                            )}
                          >
                                                     {column.key === 'name' && row.espnId ? (
                             <div className="flex items-center space-x-2">
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
                               <span className="text-blue-600 dark:text-blue-400 hover:underline">
                                 {displayValue}
                               </span>
                             </div>
                                                       ) : column.key === 'team_name' || column.key === 'teamName' ? (
                              (() => {
                                console.log('StatsTable: Rendering team column with value:', displayValue)
                                return (
                                  <TeamBadge 
                                    teamName={displayValue as string}
                                    size="sm"
                                    variant="logo"
                                    showAbbr={false}
                                  />
                                )
                              })()
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