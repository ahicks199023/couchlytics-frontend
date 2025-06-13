// lib/api.ts
export const apiBase = process.env.NEXT_PUBLIC_API_BASE;

export const fetchFromApi = async (path: string, options: RequestInit = {}) => {
  const res = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    ...options
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};
