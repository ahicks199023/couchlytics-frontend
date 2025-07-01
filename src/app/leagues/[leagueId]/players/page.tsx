"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/config";

interface Player {
  id: number;
  name: string;
  position: string;
  teamName?: string;
  user?: string;
  value?: number;
  [key: string]: string | number | undefined;
}

const positions = [
  "QB", "RB", "WR", "TE", "K", "DEF", "OL", "DL", "LB", "CB", "S"
];

const PAGE_SIZE = 20;

export default function LeaguePlayersPage() {
  const { leagueId } = useParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch players from server with all filters, sort, and pagination
  useEffect(() => {
    if (!leagueId) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sortKey,
      sortDir,
    });
    if (search) params.append("search", search);
    if (position) params.append("position", position);
    if (team) params.append("team", team);
    fetch(`${API_BASE}/leagues/${leagueId}/players?${params.toString()}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setPlayers(data.players || []);
        setTotalResults(data.total || 0);
        setTotalPages(Math.max(1, Math.ceil((data.total || 0) / PAGE_SIZE)));
      })
      .catch(() => setError("Failed to load players."))
      .finally(() => setLoading(false));
  }, [leagueId, page, search, position, team, sortKey, sortDir]);

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

  // Reset to page 1 when filters/search/sort change
  useEffect(() => {
    setPage(1);
  }, [search, position, team, sortKey, sortDir]);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Players Database</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Fuzzy search by name..."
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
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Fuzzy search by team..."
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
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
              <th className="cursor-pointer" onClick={() => handleSort("user")}>User</th>
              <th className="cursor-pointer" onClick={() => handleSort("value")}>Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Loading players...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-red-400">
                  {error}
                </td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No players found.
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-800">
                  <td>{player.name}</td>
                  <td>{player.position}</td>
                  <td>{player.teamName}</td>
                  <td>{player.user}</td>
                  <td>{player.value ?? "-"}</td>
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
