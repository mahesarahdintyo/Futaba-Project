export interface Land {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export async function getLands(): Promise<Land[]> {
  const url = "/api/lands";

  console.log("[operator-debug][getLands] fetching:", url);

  const response = await fetch(url, {
    cache: "no-store",
  });

  console.log("[operator-debug][getLands] response:", {
    url,
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Failed to load lands");
  }

  const data = await response.json();

  console.log("[operator-debug][getLands] data:", {
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : null,
    data,
  });

  return data;
}
