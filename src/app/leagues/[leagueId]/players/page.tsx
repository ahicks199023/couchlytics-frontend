"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchFromApi } from '@/lib/api';

interface Player {
  id: number;
  name: string;
  position: string;
  teamName?: string;
  team?: string;
  team_name?: string;
  overall?: number;
  speed?: number;
  age?: number;
  height?: number;
  weight?: number;
  durability?: number;
  dev_trait?: string;
  cap_hit?: number;
  contract_years_left?: number;
  headshot_url?: string;
  headshot_confidence?: number;
  headshot_source?: string;
  
  // Legacy fields for backward compatibility
  devTrait?: string;
  value?: number;
  maddenId?: string;
  
  [key: string]: string | number | undefined;
}

const positions = [
  "QB", "RB", "WR", "TE", "K", "DEF", "OL", "DL", "LB", "CB", "S"
];

const devTraits = [
  { value: "", label: "All Dev Traits" },
  { value: "0", label: "Normal" },
  { value: "1", label: "Star" },
  { value: "2", label: "Superstar" },
  { value: "3", label: "X-Factor" },
];

// Define all columns in order - based on actual API response fields
const allColumns = [
  { key: "name", label: "Name", width: "200px" },
  { key: "position", label: "Position", width: "100px" },
  { key: "teamName", label: "Team", width: "150px" },
  { key: "overall", label: "OVR", width: "80px" },
  { key: "speed", label: "Speed", width: "80px" },
  { key: "age", label: "Age", width: "80px" },
  { key: "height", label: "Height", width: "80px" },
  { key: "weight", label: "Weight", width: "80px" },
  { key: "durability", label: "Durability", width: "100px" },
  { key: "devTrait", label: "Dev Trait", width: "100px" },
  { key: "capHit", label: "Cap Hit", width: "100px" },
  { key: "contractYearsLeft", label: "Years Left", width: "100px" },
];



export default function LeaguePlayersPage() {
  const { leagueId } = useParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [devTrait, setDevTrait] = useState("");
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sortKey,
      sortDir,
    });
    if (search) params.append("search", search);
    if (position) params.append("position", position);
    if (team) params.append("team", team);
    if (devTrait) params.append("devTrait", devTrait);
    console.log(`[PlayersList] Fetching players for league ${leagueId} with params:`, params.toString())
    fetchFromApi(`/leagues/${leagueId}/players?${params.toString()}`)
      .then((data => {
        const typedData = data as { players: Player[]; total: number };
        console.log('[PlayersList] API Response:', typedData);
        if (typedData.players && typedData.players.length > 0) {
          console.log('[PlayersList] First player data:', typedData.players[0]);
          console.log('[PlayersList] Available fields:', Object.keys(typedData.players[0]));
        }
        setPlayers(typedData.players || []);
        setTotalResults(typedData.total || 0);
        setTotalPages(Math.max(1, Math.ceil((typedData.total || 0) / pageSize)));
      }))
      .catch((err) => {
        console.error('[PlayersList] Failed to load players:', err)
        console.error('[PlayersList] Error details:', {
          leagueId,
          params: params.toString(),
          error: err instanceof Error ? err.message : String(err)
        })
        setError("Failed to load players.")
      })
      .finally(() => setLoading(false));
  }, [leagueId, page, search, position, team, devTrait, sortKey, sortDir, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  // Reset to page 1 when filters/search/sort/pageSize change
  useEffect(() => {
    setPage(1);
  }, [search, position, team, devTrait, sortKey, sortDir, pageSize]);

  const getColumnValue = (player: Player, columnKey: string): string | number => {
    // Handle snake_case field names from API
    let value;
    
    switch (columnKey) {
      case "capHit":
        value = player.cap_hit;
        break;
      case "contractYearsLeft":
        value = player.contract_years_left;
        break;
      case "devTrait":
        value = player.dev_trait;
        break;
      default:
        value = player[columnKey];
    }
    
    if (columnKey === "devTrait") {
      return devTraits.find(dt => dt.value === value)?.label || '-';
    }
    
    if (columnKey === "capHit" && typeof value === 'number') {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    
    if (columnKey === "height" && typeof value === 'number') {
      const feet = Math.floor(value / 12);
      const inches = value % 12;
      return `${feet}'${inches}"`;
    }
    
    if (value === undefined || value === null) {
      return '-';
    }
    
    return value;
  };

  const renderTableRow = (player: Player) => (
    <tr key={player.id} className="hover:bg-gray-800">
      {allColumns.map((column) => (
        <td 
          key={column.key}
          className="px-3 py-2 border-b border-gray-700"
          style={{ width: column.width, minWidth: column.width }}
        >
          {column.key === "name" ? (
            <Link href={`/leagues/${leagueId}/players/${player.id}`} className="text-blue-400 hover:underline">
              {player.name}
            </Link>
          ) : (
            <span className={typeof getColumnValue(player, column.key) === 'number' ? 'text-right block' : ''}>
              {getColumnValue(player, column.key)}
            </span>
          )}
        </td>
      ))}
    </tr>
  );

  const renderLoadingRow = () => (
    <tr>
      <td colSpan={allColumns.length} className="text-center py-8 text-gray-400">
        Loading players...
      </td>
    </tr>
  );

  const renderErrorRow = () => (
    <tr>
      <td colSpan={allColumns.length} className="text-center py-8 text-red-400">
        {error}
      </td>
    </tr>
  );

  const renderEmptyRow = () => (
    <tr>
      <td colSpan={allColumns.length} className="text-center py-8 text-gray-400">
        No players found.
      </td>
    </tr>
  );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Players Database</h1>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        >
          <option value="">All Positions</option>
          {positions.map((pos) => (
            <option key={pos} value={pos}>{pos}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by team..."
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
        <select
          value={devTrait}
          onChange={e => setDevTrait(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        >
          {devTraits.map(dt => (
            <option key={dt.value} value={dt.value}>{dt.label}</option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={e => setPageSize(Number(e.target.value))}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>
      
      {/* Player Count */}
      <div className="mb-4 text-gray-400 text-sm">
        Showing {players.length} of {totalResults} players (Page {page} of {totalPages})
      </div>
      
      {/* Table Container */}
      <div className="bg-gray-900 rounded border border-gray-700" style={{ width: '100%', overflow: 'hidden' }}>
        <div className="overflow-x-auto" style={{ width: '100%' }}>
          <table className="text-sm" style={{ minWidth: 'max-content' }}>
            <thead>
              <tr>
                {allColumns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-3 py-2 text-left border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors sticky top-0 bg-gray-900 z-10"
                    style={{ width: column.width, minWidth: column.width }}
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.label}</span>
                      {sortKey === column.key && (
                        <span className="ml-1">
                          {sortDir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? renderLoadingRow() : 
               error ? renderErrorRow() : 
               players.length === 0 ? renderEmptyRow() : 
               players.map(renderTableRow)}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-gray-300">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 rounded bg-gray-700 text-white disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
} 
