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

function fuzzyMatch(needle: string, haystack: string) {
  // Simple case-insensitive substring match for fuzzy search
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

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

  useEffect(() => {
    if (!leagueId) return;
    setLoading(true);
    fetch(`${API_BASE}/leagues/${leagueId}/players`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => setError("Failed to load players."))
      .finally(() => setLoading(false));
  }, [leagueId]);

  // Filter, fuzzy search, and sort players
  let filtered = players.filter((p) => {
    const matchesName = !search || fuzzyMatch(search, p.name);
    const matchesPosition = !position || p.position === position;
    const matchesTeam = !team || (p.teamName && fuzzyMatch(team, p.teamName));
    return matchesName && matchesPosition && matchesTeam;
  });
  filtered = filtered.sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return sortDir === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  // Pagination
  const totalResults = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  // Reset to page 1 when filters/search change
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
        Showing {paginated.length} of {totalResults} players (Page {page} of {totalPages})
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
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No players found.
                </td>
              </tr>
            ) : (
              paginated.map((player) => (
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
