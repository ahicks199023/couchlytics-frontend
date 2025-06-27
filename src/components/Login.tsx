// components/Login.tsx
"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/config";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.push("/leagues"); // ✅ Redirect updated here
      } else {
        const data = await response.json();
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login error. Please try again.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
        Couchlytics Login
      </h2>
      <form onSubmit={handleLogin}>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          required
          className="w-full p-2 mb-4 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Password
        </label>
        <input
          type="password"
          required
          className="w-full p-2 mb-4 border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          Sign In
        </button>

        {error && (
          <p className="text-red-600 mt-3 text-center font-medium">{error}</p>
        )}
      </form>
    </div>
  );
}

