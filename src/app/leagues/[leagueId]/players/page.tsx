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

  useEffect(() => {
    if (!leagueId) return;
    setLoading(true);
    fetch(`${API_BASE}/leagues/${leagueId}/players`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setPlayers(data.players || []))
      .catch(() => setError("Failed to load players."))
      .finally(() => setLoading(false));
  }, [leagueId]);

  // Filter and sort players
  let filtered = players.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesPosition = !position || p.position === position;
    const matchesTeam = !team || (p.teamName || "").toLowerCase().includes(team.toLowerCase());
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

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

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
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by team..."
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  No players found.
                </td>
              </tr>
            ) : (
              filtered.map((player) => (
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
    </main>
  );
} 
