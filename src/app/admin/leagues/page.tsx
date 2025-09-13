'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi, League } from '@/lib/adminApi'
import useAuth from '@/Hooks/useAuth'

export default function LeagueManagementPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeagues, setTotalLeagues] = useState(0)
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [leagueMembers, setLeagueMembers] = useState<Record<string, unknown>[]>([])
  const [membersLoading, setMembersLoading] = useState(false)

  const fetchLeagues = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminApi.getLeagues({
        page: currentPage,
        per_page: 20,
        search: searchQuery || undefined,
        active: activeFilter,
      })
      
      if (data) {
        setLeagues(data.leagues)
        setTotalPages(Math.ceil(data.total / data.per_page))
        setTotalLeagues(data.total)
      } else {
        setError('Failed to load leagues')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchQuery, activeFilter])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user && !user.isAdmin) {
      router.push('/unauthorized')
      return
    }

    if (user?.isAdmin) {
      fetchLeagues()
    }
  }, [user, authLoading, router, fetchLeagues])

  const fetchLeagueMembers = async (leagueId: number) => {
    try {
      setMembersLoading(true)
      const data = await adminApi.getLeagueMembers(leagueId, { page: 1, per_page: 100 })
      if (data) {
        setLeagueMembers(data.members)
      }
    } catch (err) {
      console.error('Failed to fetch league members:', err)
    } finally {
      setMembersLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchLeagues()
  }

  const handleViewMembers = async (league: League) => {
    setSelectedLeague(league)
    setShowMembersModal(true)
    await fetchLeagueMembers(league.id)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Leagues...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon-green">League Management</h1>
            <p className="text-gray-400 mt-2">Manage leagues, members, and assignments</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{totalLeagues}</p>
            <p className="text-gray-400 text-sm">Total Leagues</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by league name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-green"
              />
            </div>
            <div>
              <select
                value={activeFilter === undefined ? '' : activeFilter.toString()}
                onChange={(e) => setActiveFilter(e.target.value === '' ? undefined : e.target.value === 'true')}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-neon-green"
              >
                <option value="">All Leagues</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-neon-green text-black font-semibold px-6 py-2 rounded-lg hover:bg-green-400 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Leagues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <div key={league.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{league.name}</h3>
                  <p className="text-gray-400 text-sm">{league.description}</p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  league.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {league.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Members:</span>
                  <span className="text-white">{league.member_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">{new Date(league.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Commissioner ID:</span>
                  <span className="text-white">{league.commissioner_id}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewMembers(league)}
                  className="flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Members
                </button>
                <button
                  onClick={() => router.push(`/leagues/${league.id}`)}
                  className="flex-1 bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                >
                  View League
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalLeagues)} of {totalLeagues} leagues
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* League Members Modal */}
      {showMembersModal && selectedLeague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  Members of {selectedLeague.name}
                </h3>
                <button
                  onClick={() => {
                    setShowMembersModal(false)
                    setSelectedLeague(null)
                    setLeagueMembers([])
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {membersLoading ? (
                <div className="text-center text-white">Loading members...</div>
              ) : leagueMembers.length > 0 ? (
                <div className="space-y-3">
                  {leagueMembers.map((member, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">
                            {(member as { name?: string; email?: string }).name || 
                             (member as { name?: string; email?: string }).email}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {(member as { email?: string }).email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white text-sm">
                            {(member as { role?: string }).role}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {(member as { is_active?: boolean }).is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400">No members found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
