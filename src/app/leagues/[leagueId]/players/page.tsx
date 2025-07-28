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
  maddenId?: string; // Add madden_id field for unified navigation
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

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Players Database</h1>
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
      <div className="mb-4 text-gray-400 text-sm">
        Showing {players.length} of {totalResults} players (Page {page} of {totalPages})
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-gray-900 rounded">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => handleSort("name")}>Name</th>
              <th className="cursor-pointer" onClick={() => handleSort("position")}>Position</th>
              <th className="cursor-pointer" onClick={() => handleSort("teamName")}>Team</th>
              <th className="cursor-pointer" onClick={() => handleSort("overall")}>OVR</th>
              <th className="cursor-pointer" onClick={() => handleSort("speed")}>Speed</th>
              <th className="cursor-pointer" onClick={() => handleSort("devTrait")}>Dev Trait</th>
              <th className="cursor-pointer" onClick={() => handleSort("value")}>Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Loading players...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-red-400">
                  {error}
                </td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No players found.
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-800">
                  <td>
                    <Link href={`/leagues/${leagueId}/players/${player.id}`} className="text-blue-400 hover:underline">
                      {player.name}
                    </Link>
                  </td>
                  <td>{player.position}</td>
                  <td>{player.teamName}</td>
                  <td>{player.overall ?? '-'}</td>
                  <td>{player.speed ?? '-'}</td>
                  <td>{devTraits.find(dt => dt.value === player.devTrait)?.label ?? '-'}</td>
                  <td>{player.value ?? '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
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
