export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  land_id: string;
  created_at: string;
  item_count?: number;
}

interface FolderQuery {
  landId?: string;
  parentId?: number | null;
  includeAll?: boolean;
  search?: string;
}

export async function getFolders({
  landId,
  parentId,
  includeAll = false,
  search,
}: FolderQuery = {}): Promise<Folder[]> {
  const params = new URLSearchParams();

  if (landId) {
    params.set("landId", landId);
  }

  if (typeof parentId === "number") {
    params.set("parentId", parentId.toString());
  }

  if (includeAll) {
    params.set("includeAll", "true");
  }

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  const query = params.toString();
  const url = `/api/folders${query ? `?${query}` : ""}`;

  console.log("[operator-debug][getFolders] params:", {
    landId,
    parentId,
    includeAll,
    search,
  });
  console.log("[operator-debug][getFolders] fetching:", url);

  const response = await fetch(url, {
    cache: "no-store",
  });

  console.log("[operator-debug][getFolders] response:", {
    url,
    ok: response.ok,
    status: response.status,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Failed to load folders");
  }

  const data = await response.json();

  console.log("[operator-debug][getFolders] data:", {
    isArray: Array.isArray(data),
    length: Array.isArray(data) ? data.length : null,
    data,
  });

  return data;
}

export async function getFoldersByLand(landId: string): Promise<Folder[]> {
  return getFolders({ landId });
}
