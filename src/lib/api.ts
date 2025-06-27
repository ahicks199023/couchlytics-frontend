// lib/api.ts
export const apiBase = process.env.NEXT_PUBLIC_API_BASE;

// Type for objects that can be converted between snake_case and camelCase
type ConvertibleObject = Record<string, unknown>;

// Convert snake_case to camelCase
const toCamelCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const camelCaseObj: ConvertibleObject = {};
  for (const key in obj as ConvertibleObject) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      camelCaseObj[camelKey] = toCamelCase((obj as ConvertibleObject)[key]);
    }
  }
  return camelCaseObj;
};

// Convert camelCase to snake_case
const toSnakeCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  const snakeCaseObj: ConvertibleObject = {};
  for (const key in obj as ConvertibleObject) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      snakeCaseObj[snakeKey] = toSnakeCase((obj as ConvertibleObject)[key]);
    }
  }
  return snakeCaseObj;
};

export const fetchFromApi = async (path: string, options: RequestInit = {}): Promise<unknown> => {
  const res = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    ...options
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error: ${res.status} - ${errorText}`);
  }
  
  const data = await res.json();
  return toCamelCase(data); // Convert response to camelCase
};

// Enhanced API functions with automatic case conversion
export const api = {
  get: async (path: string): Promise<unknown> => {
    return fetchFromApi(path);
  },

  post: async (path: string, body: ConvertibleObject): Promise<unknown> => {
    const snakeCaseBody = toSnakeCase(body); // Convert request body to snake_case
    return fetchFromApi(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snakeCaseBody),
    });
  },

  put: async (path: string, body: ConvertibleObject): Promise<unknown> => {
    const snakeCaseBody = toSnakeCase(body);
    return fetchFromApi(path, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snakeCaseBody),
    });
  },

  delete: async (path: string): Promise<unknown> => {
    return fetchFromApi(path, {
      method: 'DELETE',
    });
  },

  patch: async (path: string, body: ConvertibleObject): Promise<unknown> => {
    const snakeCaseBody = toSnakeCase(body);
    return fetchFromApi(path, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snakeCaseBody),
    });
  }
};
