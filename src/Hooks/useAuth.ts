import { useEffect, useState } from "react";

interface User {
  id: number;
  email: string;
  isAdmin: boolean;
  isCommissioner: boolean;
  isPremium: boolean;
  teamId?: number
}

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("http://localhost:5000/me", {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const isAdmin = data.id === 1; // ✅ admin condition
          setUser({ ...data, isAdmin });
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}

