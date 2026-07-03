export interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  file: {
    name: string;
    path: string;
    size?: number;
  };
  targetTime?: string | null;
}

interface DocumentQuery {
  folderId?: number | null;
  landId?: string;
  search?: string;
}

export async function getDocuments({
  folderId,
  landId,
  search,
}: DocumentQuery = {}): Promise<Document[]> {
  const params = new URLSearchParams();

  if (typeof folderId === "number") {
    params.set("folderId", folderId.toString());
  }

  if (landId) {
    params.set("landId", landId);
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  const url = `/api/documents${query ? `?${query}` : ""}`;

  console.log("[operator-debug][getDocuments] params:", {
    landId,
    folderId,
    search,
  });
  console.log("[operator-debug][getDocuments] fetching:", url);

  const response = await fetch(url, {
    cache: "no-store",
  });

  console.log("[operator-debug][getDocuments] response:", {
    url,
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Failed to load documents");
  }

  const data = await response.json();

  console.log("[operator-debug][getDocuments] data:", {
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : null,
    data,
  });

  return data;
}
