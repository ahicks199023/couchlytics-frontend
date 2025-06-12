// src/lib/api.ts
export async function fetchFromBackend(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE;
  const res = await fetch(`${baseUrl}${path}`);

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
