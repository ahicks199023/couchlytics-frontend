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

// Define all columns with their display names and sort keys
const columns = [
  // Frozen columns (first 3)
  { key: "name", label: "Name", frozen: true, width: "200px" },
  { key: "position", label: "Position", frozen: true, width: "100px" },
  { key: "teamName", label: "Team", frozen: true, width: "150px" },
  
  // Scrollable columns
  { key: "overall", label: "OVR", frozen: false, width: "80px" },
  { key: "speedRating", label: "Speed", frozen: false, width: "80px" },
  { key: "accelerationRating", label: "Accel", frozen: false, width: "80px" },
  { key: "agilityRating", label: "Agility", frozen: false, width: "80px" },
  { key: "strengthRating", label: "Strength", frozen: false, width: "80px" },
  { key: "awareRating", label: "Aware", frozen: false, width: "80px" },
  { key: "jumpRating", label: "Jump", frozen: false, width: "80px" },
  { key: "staminaRating", label: "Stamina", frozen: false, width: "80px" },
  { key: "toughnessRating", label: "Tough", frozen: false, width: "80px" },
  { key: "injuryRating", label: "Injury", frozen: false, width: "80px" },
  
  // Passing
  { key: "throwPowerRating", label: "Throw Power", frozen: false, width: "100px" },
  { key: "throwAccRating", label: "Throw Acc", frozen: false, width: "100px" },
  { key: "shortAccuracyRating", label: "Short Acc", frozen: false, width: "100px" },
  { key: "midAccuracyRating", label: "Mid Acc", frozen: false, width: "100px" },
  { key: "deepAccuracyRating", label: "Deep Acc", frozen: false, width: "100px" },
  { key: "throwOnRunRating", label: "Throw Run", frozen: false, width: "100px" },
  { key: "playActionRating", label: "Play Action", frozen: false, width: "100px" },
  { key: "breakSackRating", label: "Break Sack", frozen: false, width: "100px" },
  { key: "underPressureRating", label: "Under Press", frozen: false, width: "100px" },
  
  // Rushing
  { key: "carryRating", label: "Carry", frozen: false, width: "80px" },
  { key: "changeOfDirectionRating", label: "COD", frozen: false, width: "80px" },
  { key: "spinMoveRating", label: "Spin", frozen: false, width: "80px" },
  { key: "jukeMoveRating", label: "Juke", frozen: false, width: "80px" },
  { key: "breakTackleRating", label: "Break Tackle", frozen: false, width: "100px" },
  { key: "ballCarryVisionRating", label: "BCV", frozen: false, width: "80px" },
  { key: "truckingRating", label: "Trucking", frozen: false, width: "80px" },
  { key: "stiffArmRating", label: "Stiff Arm", frozen: false, width: "80px" },
  
  // Receiving
  { key: "catchRating", label: "Catch", frozen: false, width: "80px" },
  { key: "specCatchRating", label: "Spec Catch", frozen: false, width: "100px" },
  { key: "releaseRating", label: "Release", frozen: false, width: "80px" },
  { key: "catchInTrafficRating", label: "CIT", frozen: false, width: "80px" },
  { key: "routeRunShortRating", label: "Short Route", frozen: false, width: "100px" },
  { key: "medRouteRunRating", label: "Med Route", frozen: false, width: "100px" },
  { key: "deepRouteRunRating", label: "Deep Route", frozen: false, width: "100px" },
  { key: "kickReturnRating", label: "Kick Return", frozen: false, width: "100px" },
  
  // Blocking
  { key: "passBlockRating", label: "Pass Block", frozen: false, width: "100px" },
  { key: "passBlockPowerRating", label: "PB Power", frozen: false, width: "100px" },
  { key: "passBlockFinesseRating", label: "PB Finesse", frozen: false, width: "100px" },
  { key: "runBlockRating", label: "Run Block", frozen: false, width: "100px" },
  { key: "runBlockPowerRating", label: "RB Power", frozen: false, width: "100px" },
  { key: "runBlockFinesseRating", label: "RB Finesse", frozen: false, width: "100px" },
  { key: "leadBlockRating", label: "Lead Block", frozen: false, width: "100px" },
  { key: "impactBlockRating", label: "Impact Block", frozen: false, width: "100px" },
  
  // Defense
  { key: "tackleRating", label: "Tackle", frozen: false, width: "80px" },
  { key: "hitPowerRating", label: "Hit Power", frozen: false, width: "100px" },
  { key: "pursuitRating", label: "Pursuit", frozen: false, width: "80px" },
  { key: "playRecognitionRating", label: "Play Rec", frozen: false, width: "100px" },
  { key: "blockShedRating", label: "Block Shed", frozen: false, width: "100px" },
  { key: "finesseMovesRating", label: "Finesse", frozen: false, width: "80px" },
  { key: "powerMovesRating", label: "Power", frozen: false, width: "80px" },
  { key: "manCoverRating", label: "Man Cover", frozen: false, width: "100px" },
  { key: "zoneCoverRating", label: "Zone Cover", frozen: false, width: "100px" },
  { key: "pressRating", label: "Press", frozen: false, width: "80px" },
  
  // Kicking
  { key: "kickPowerRating", label: "Kick Power", frozen: false, width: "100px" },
  { key: "kickAccuracyRating", label: "Kick Acc", frozen: false, width: "100px" },
  
  // Contract & Financial
  { key: "capHit", label: "Cap Hit", frozen: false, width: "100px" },
  { key: "salary", label: "Salary", frozen: false, width: "100px" },
  { key: "bonus", label: "Bonus", frozen: false, width: "100px" },
  { key: "yearsLeft", label: "Years Left", frozen: false, width: "100px" },
  { key: "contractLength", label: "Contract Length", frozen: false, width: "120px" },
  { key: "releaseNetSavings", label: "Release Savings", frozen: false, width: "120px" },
  { key: "totalReleasePenalty", label: "Release Penalty", frozen: false, width: "120px" },
  
  // Additional Details
  { key: "jerseyNumber", label: "Jersey", frozen: false, width: "80px" },
  { key: "yearsPro", label: "Years Pro", frozen: false, width: "100px" },
  { key: "rookieYear", label: "Rookie Year", frozen: false, width: "100px" },
  { key: "draftRound", label: "Draft Round", frozen: false, width: "100px" },
  { key: "draftPick", label: "Draft Pick", frozen: false, width: "100px" },
  { key: "college", label: "College", frozen: false, width: "150px" },
  { key: "height", label: "Height", frozen: false, width: "80px" },
  { key: "weight", label: "Weight", frozen: false, width: "80px" },
  { key: "age", label: "Age", frozen: false, width: "80px" },
  { key: "hometown", label: "Hometown", frozen: false, width: "150px" },
  { key: "homeState", label: "State", frozen: false, width: "80px" },
  { key: "durabilityRating", label: "Durability", frozen: false, width: "100px" },
  { key: "experiencePoints", label: "XP", frozen: false, width: "80px" },
  { key: "skillPoints", label: "Skill Points", frozen: false, width: "100px" },
  { key: "legacyScore", label: "Legacy", frozen: false, width: "80px" },
  { key: "devTrait", label: "Dev Trait", frozen: false, width: "100px" },
  { key: "value", label: "Value", frozen: false, width: "100px" },
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

  const frozenColumns = columns.filter(col => col.frozen);
  const scrollableColumns = columns.filter(col => !col.frozen);

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
      
      {/* Table Container with Horizontal Scroll */}
      <div className="relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-900 rounded" style={{ minWidth: "max-content" }}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className={`px-3 py-2 text-left border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                      column.frozen ? 'sticky left-0 z-20 bg-gray-900' : ''
                    }`}
                    style={{ 
                      width: column.width,
                      minWidth: column.width,
                      ...(column.frozen && column.key !== "name" ? { left: column.key === "position" ? "200px" : "300px" } : {})
                    }}
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
                  <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                    Loading players...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-red-400">
                    {error}
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-8 text-gray-400">
                    No players found.
                  </td>
                </tr>
              ) : (
                players.map((player) => (
                  <tr key={player.id} className="hover:bg-gray-800">
                    {columns.map((column) => (
                      <td 
                        key={column.key}
                        className={`px-3 py-2 border-b border-gray-700 ${
                          column.frozen ? 'sticky left-0 z-10 bg-gray-900' : ''
                        }`}
                        style={{ 
                          width: column.width,
                          minWidth: column.width,
                          ...(column.frozen && column.key !== "name" ? { left: column.key === "position" ? "200px" : "300px" } : {})
                        }}
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
