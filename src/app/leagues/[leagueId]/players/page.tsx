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

// Define all columns in order
const allColumns = [
  { key: "name", label: "Name", width: "200px" },
  { key: "position", label: "Position", width: "100px" },
  { key: "teamName", label: "Team", width: "150px" },
  { key: "overall", label: "OVR", width: "80px" },
  { key: "speed", label: "Speed", width: "80px" },
  { key: "acceleration", label: "Accel", width: "80px" },
  { key: "agility", label: "Agility", width: "80px" },
  { key: "strength", label: "Strength", width: "80px" },
  { key: "awareness", label: "Aware", width: "80px" },
  { key: "jumping", label: "Jump", width: "80px" },
  { key: "stamina", label: "Stamina", width: "80px" },
  { key: "toughness", label: "Tough", width: "80px" },
  { key: "injury", label: "Injury", width: "80px" },
  
  // Passing
  { key: "throwPower", label: "Throw Power", width: "100px" },
  { key: "throwAccuracy", label: "Throw Acc", width: "100px" },
  { key: "shortAccuracy", label: "Short Acc", width: "100px" },
  { key: "midAccuracy", label: "Mid Acc", width: "100px" },
  { key: "deepAccuracy", label: "Deep Acc", width: "100px" },
  { key: "throwOnRun", label: "Throw Run", width: "100px" },
  { key: "playAction", label: "Play Action", width: "100px" },
  { key: "breakSack", label: "Break Sack", width: "100px" },
  { key: "underPressure", label: "Under Press", width: "100px" },
  
  // Rushing
  { key: "carrying", label: "Carry", width: "80px" },
  { key: "changeOfDirection", label: "COD", width: "80px" },
  { key: "spinMove", label: "Spin", width: "80px" },
  { key: "jukeMove", label: "Juke", width: "80px" },
  { key: "breakTackle", label: "Break Tackle", width: "100px" },
  { key: "ballCarrierVision", label: "BCV", width: "80px" },
  { key: "trucking", label: "Trucking", width: "80px" },
  { key: "stiffArm", label: "Stiff Arm", width: "80px" },
  
  // Receiving
  { key: "catching", label: "Catch", width: "80px" },
  { key: "spectacularCatch", label: "Spec Catch", width: "100px" },
  { key: "release", label: "Release", width: "80px" },
  { key: "catchInTraffic", label: "CIT", width: "80px" },
  { key: "routeRunShort", label: "Short Route", width: "100px" },
  { key: "routeRunMedium", label: "Med Route", width: "100px" },
  { key: "routeRunDeep", label: "Deep Route", width: "100px" },
  { key: "kickReturn", label: "Kick Return", width: "100px" },
  
  // Blocking
  { key: "passBlock", label: "Pass Block", width: "100px" },
  { key: "passBlockPower", label: "PB Power", width: "100px" },
  { key: "passBlockFinesse", label: "PB Finesse", width: "100px" },
  { key: "runBlock", label: "Run Block", width: "100px" },
  { key: "runBlockPower", label: "RB Power", width: "100px" },
  { key: "runBlockFinesse", label: "RB Finesse", width: "100px" },
  { key: "leadBlock", label: "Lead Block", width: "100px" },
  { key: "impactBlock", label: "Impact Block", width: "100px" },
  
  // Defense
  { key: "tackle", label: "Tackle", width: "80px" },
  { key: "hitPower", label: "Hit Power", width: "100px" },
  { key: "pursuit", label: "Pursuit", width: "80px" },
  { key: "playRecognition", label: "Play Rec", width: "100px" },
  { key: "blockShedding", label: "Block Shed", width: "100px" },
  { key: "finesseMoves", label: "Finesse", width: "80px" },
  { key: "powerMoves", label: "Power", width: "80px" },
  { key: "manCoverage", label: "Man Cover", width: "100px" },
  { key: "zoneCoverage", label: "Zone Cover", width: "100px" },
  { key: "press", label: "Press", width: "80px" },
  
  // Kicking
  { key: "kickPower", label: "Kick Power", width: "100px" },
  { key: "kickAccuracy", label: "Kick Acc", width: "100px" },
  
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
  { key: "durability", label: "Durability", width: "100px" },
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
    const value = player[columnKey];
    
    if (columnKey === "devTrait") {
      return devTraits.find(dt => dt.value === value)?.label || '-';
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
