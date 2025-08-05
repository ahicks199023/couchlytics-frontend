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
  overall?: number;
  speed?: number;
  devTrait?: string;
  value?: number;
  maddenId?: string;
  
  // Core Attributes
  speedRating?: number;
  accelerationRating?: number;
  agilityRating?: number;
  strengthRating?: number;
  awareRating?: number;
  jumpRating?: number;
  staminaRating?: number;
  toughnessRating?: number;
  injuryRating?: number;
  
  // Passing Attributes
  throwPowerRating?: number;
  throwAccRating?: number;
  shortAccuracyRating?: number;
  midAccuracyRating?: number;
  deepAccuracyRating?: number;
  throwOnRunRating?: number;
  playActionRating?: number;
  breakSackRating?: number;
  underPressureRating?: number;
  
  // Rushing Attributes
  carryRating?: number;
  changeOfDirectionRating?: number;
  spinMoveRating?: number;
  jukeMoveRating?: number;
  breakTackleRating?: number;
  ballCarryVisionRating?: number;
  truckingRating?: number;
  stiffArmRating?: number;
  
  // Receiving Attributes
  catchRating?: number;
  specCatchRating?: number;
  releaseRating?: number;
  catchInTrafficRating?: number;
  routeRunShortRating?: number;
  medRouteRunRating?: number;
  deepRouteRunRating?: number;
  kickReturnRating?: number;
  
  // Blocking Attributes
  passBlockRating?: number;
  passBlockPowerRating?: number;
  passBlockFinesseRating?: number;
  runBlockRating?: number;
  runBlockPowerRating?: number;
  runBlockFinesseRating?: number;
  leadBlockRating?: number;
  impactBlockRating?: number;
  
  // Defense Attributes
  tackleRating?: number;
  hitPowerRating?: number;
  pursuitRating?: number;
  playRecognitionRating?: number;
  blockShedRating?: number;
  finesseMovesRating?: number;
  powerMovesRating?: number;
  manCoverRating?: number;
  zoneCoverRating?: number;
  pressRating?: number;
  
  // Kicking Attributes
  kickPowerRating?: number;
  kickAccuracyRating?: number;
  
  // Contract & Financial
  capHit?: number;
  salary?: number;
  bonus?: number;
  yearsLeft?: number;
  contractLength?: number;
  releaseNetSavings?: number;
  totalReleasePenalty?: number;
  
  // Additional Player Details
  jerseyNumber?: string;
  yearsPro?: number;
  rookieYear?: number;
  draftRound?: number;
  draftPick?: number;
  college?: string;
  height?: number;
  weight?: number;
  age?: number;
  hometown?: string;
  homeState?: string;
  durabilityRating?: number;
  experiencePoints?: number;
  skillPoints?: number;
  legacyScore?: number;
  
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

// Define frozen columns (first 3)
const frozenColumns = [
  { key: "name", label: "Name", width: "200px" },
  { key: "position", label: "Position", width: "100px" },
  { key: "teamName", label: "Team", width: "150px" },
];

// Define scrollable columns (all other attributes)
const scrollableColumns = [
  { key: "overall", label: "OVR", width: "80px" },
  { key: "speedRating", label: "Speed", width: "80px" },
  { key: "accelerationRating", label: "Accel", width: "80px" },
  { key: "agilityRating", label: "Agility", width: "80px" },
  { key: "strengthRating", label: "Strength", width: "80px" },
  { key: "awareRating", label: "Aware", width: "80px" },
  { key: "jumpRating", label: "Jump", width: "80px" },
  { key: "staminaRating", label: "Stamina", width: "80px" },
  { key: "toughnessRating", label: "Tough", width: "80px" },
  { key: "injuryRating", label: "Injury", width: "80px" },
  
  // Passing
  { key: "throwPowerRating", label: "Throw Power", width: "100px" },
  { key: "throwAccRating", label: "Throw Acc", width: "100px" },
  { key: "shortAccuracyRating", label: "Short Acc", width: "100px" },
  { key: "midAccuracyRating", label: "Mid Acc", width: "100px" },
  { key: "deepAccuracyRating", label: "Deep Acc", width: "100px" },
  { key: "throwOnRunRating", label: "Throw Run", width: "100px" },
  { key: "playActionRating", label: "Play Action", width: "100px" },
  { key: "breakSackRating", label: "Break Sack", width: "100px" },
  { key: "underPressureRating", label: "Under Press", width: "100px" },
  
  // Rushing
  { key: "carryRating", label: "Carry", width: "80px" },
  { key: "changeOfDirectionRating", label: "COD", width: "80px" },
  { key: "spinMoveRating", label: "Spin", width: "80px" },
  { key: "jukeMoveRating", label: "Juke", width: "80px" },
  { key: "breakTackleRating", label: "Break Tackle", width: "100px" },
  { key: "ballCarryVisionRating", label: "BCV", width: "80px" },
  { key: "truckingRating", label: "Trucking", width: "80px" },
  { key: "stiffArmRating", label: "Stiff Arm", width: "80px" },
  
  // Receiving
  { key: "catchRating", label: "Catch", width: "80px" },
  { key: "specCatchRating", label: "Spec Catch", width: "100px" },
  { key: "releaseRating", label: "Release", width: "80px" },
  { key: "catchInTrafficRating", label: "CIT", width: "80px" },
  { key: "routeRunShortRating", label: "Short Route", width: "100px" },
  { key: "medRouteRunRating", label: "Med Route", width: "100px" },
  { key: "deepRouteRunRating", label: "Deep Route", width: "100px" },
  { key: "kickReturnRating", label: "Kick Return", width: "100px" },
  
  // Blocking
  { key: "passBlockRating", label: "Pass Block", width: "100px" },
  { key: "passBlockPowerRating", label: "PB Power", width: "100px" },
  { key: "passBlockFinesseRating", label: "PB Finesse", width: "100px" },
  { key: "runBlockRating", label: "Run Block", width: "100px" },
  { key: "runBlockPowerRating", label: "RB Power", width: "100px" },
  { key: "runBlockFinesseRating", label: "RB Finesse", width: "100px" },
  { key: "leadBlockRating", label: "Lead Block", width: "100px" },
  { key: "impactBlockRating", label: "Impact Block", width: "100px" },
  
  // Defense
  { key: "tackleRating", label: "Tackle", width: "80px" },
  { key: "hitPowerRating", label: "Hit Power", width: "100px" },
  { key: "pursuitRating", label: "Pursuit", width: "80px" },
  { key: "playRecognitionRating", label: "Play Rec", width: "100px" },
  { key: "blockShedRating", label: "Block Shed", width: "100px" },
  { key: "finesseMovesRating", label: "Finesse", width: "80px" },
  { key: "powerMovesRating", label: "Power", width: "80px" },
  { key: "manCoverRating", label: "Man Cover", width: "100px" },
  { key: "zoneCoverRating", label: "Zone Cover", width: "100px" },
  { key: "pressRating", label: "Press", width: "80px" },
  
  // Kicking
  { key: "kickPowerRating", label: "Kick Power", width: "100px" },
  { key: "kickAccuracyRating", label: "Kick Acc", width: "100px" },
  
  // Contract & Financial
  { key: "capHit", label: "Cap Hit", width: "100px" },
  { key: "salary", label: "Salary", width: "100px" },
  { key: "bonus", label: "Bonus", width: "100px" },
  { key: "yearsLeft", label: "Years Left", width: "100px" },
  { key: "contractLength", label: "Contract Length", width: "120px" },
  { key: "releaseNetSavings", label: "Release Savings", width: "120px" },
  { key: "totalReleasePenalty", label: "Release Penalty", width: "120px" },
  
  // Additional Details
  { key: "jerseyNumber", label: "Jersey", width: "80px" },
  { key: "yearsPro", label: "Years Pro", width: "100px" },
  { key: "rookieYear", label: "Rookie Year", width: "100px" },
  { key: "draftRound", label: "Draft Round", width: "100px" },
  { key: "draftPick", label: "Draft Pick", width: "100px" },
  { key: "college", label: "College", width: "150px" },
  { key: "height", label: "Height", width: "80px" },
  { key: "weight", label: "Weight", width: "80px" },
  { key: "age", label: "Age", width: "80px" },
  { key: "hometown", label: "Hometown", width: "150px" },
  { key: "homeState", label: "State", width: "80px" },
  { key: "durabilityRating", label: "Durability", width: "100px" },
  { key: "experiencePoints", label: "XP", width: "80px" },
  { key: "skillPoints", label: "Skill Points", width: "100px" },
  { key: "legacyScore", label: "Legacy", width: "80px" },
  { key: "devTrait", label: "Dev Trait", width: "100px" },
  { key: "value", label: "Value", width: "100px" },
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
    const value = player[columnKey];
    
    if (columnKey === "devTrait") {
      return devTraits.find(dt => dt.value === value)?.label || '-';
    }
    
    if (value === undefined || value === null) {
      return '-';
    }
    
    return value;
  };

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
      
      {/* Two-Panel Table Layout */}
      <div className="flex">
        {/* Left Panel - Frozen Columns */}
        <div className="flex-shrink-0 bg-gray-900 rounded-l border border-gray-700">
          <table className="text-sm">
            <thead>
              <tr>
                {frozenColumns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-3 py-2 text-left border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
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
              {loading ? (
                <tr>
                  <td colSpan={frozenColumns.length} className="text-center py-8 text-gray-400">
                    Loading players...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={frozenColumns.length} className="text-center py-8 text-red-400">
                    {error}
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={frozenColumns.length} className="text-center py-8 text-gray-400">
                    No players found.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-800">
                    {frozenColumns.map((column) => (
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
                          <span>{getColumnValue(player, column.key)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Right Panel - Scrollable Columns */}
        <div className="flex-1 overflow-x-auto bg-gray-900 rounded-r border border-gray-700 border-l-0">
          <table className="text-sm" style={{ minWidth: "max-content" }}>
            <thead>
              <tr>
                {scrollableColumns.map((column) => (
                  <th 
                    key={column.key}
                    className="px-3 py-2 text-left border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors"
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
              {loading ? (
                <tr>
                  <td colSpan={scrollableColumns.length} className="text-center py-8 text-gray-400">
                    Loading players...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={scrollableColumns.length} className="text-center py-8 text-red-400">
                    {error}
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={scrollableColumns.length} className="text-center py-8 text-gray-400">
                    No players found.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-800">
                    {scrollableColumns.map((column) => (
                      <td 
                        key={column.key}
                        className="px-3 py-2 border-b border-gray-700"
                        style={{ width: column.width, minWidth: column.width }}
                      >
                        <span className={typeof getColumnValue(player, column.key) === 'number' ? 'text-right block' : ''}>
                          {getColumnValue(player, column.key)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))
              )}
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
