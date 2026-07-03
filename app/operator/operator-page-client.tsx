"use client";

import OperatorHeader from "@/components/operator/OperatorHeader";
import LandSelector from "@/components/operator/LandSelector";
import SearchBar from "@/components/operator/SearchBar";
import DocumentList from "@/components/operator/DocumentList";
import { getDocuments, type Document } from "@/lib/services/document";
import { getFolders, type Folder } from "@/lib/services/folder";
import { getLands, type Land } from "@/lib/services/land";
import { useCallback, useEffect, useRef, useState } from "react";

const LAND_STORAGE_KEY = "futaba.operator.selectedLand";
const OPERATOR_LOCATION_STORAGE_KEY = "futaba.operator.location";
const WORKSPACE_REFRESH_INTERVAL_MS = 3000;
const LAND_REFRESH_INTERVAL_MS = 3000;

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface OperatorLocationState {
  landId: string;
  folderPathHistory: BreadcrumbItem[];
}

function readOperatorLocation(): OperatorLocationState | null {
  try {
    const rawLocation = window.localStorage.getItem(OPERATOR_LOCATION_STORAGE_KEY);
    if (!rawLocation) return null;

    const location = JSON.parse(rawLocation) as Partial<OperatorLocationState>;
    const folderPathHistory = Array.isArray(location.folderPathHistory)
      ? location.folderPathHistory.filter(
          (folder): folder is BreadcrumbItem =>
            typeof folder?.id === "number" && typeof folder?.name === "string"
        )
      : [];

    if (typeof location.landId !== "string") {
      return null;
    }

    return {
      landId: location.landId,
      folderPathHistory,
    };
  } catch {
    return null;
  }
}

interface OperatorPageProps {
  initialLands?: Land[];
  initialFolders?: Folder[];
  initialDocuments?: Document[];
}

export default function OperatorPage({
  initialLands = [],
  initialFolders = [],
  initialDocuments = [],
}: OperatorPageProps) {
  const [selectedLand, setSelectedLand] = useState<Land | null>(initialLands[0] ?? null);
  const [lands, setLands] = useState<Land[]>(initialLands);
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem | null>(null);
  const [folderPathHistory, setFolderPathHistory] = useState<BreadcrumbItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(initialLands.length === 0);
  const [error, setError] = useState("");
  const workspaceRequestIdRef = useRef(0);
  const landsRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const folderPathHistoryRef = useRef<BreadcrumbItem[]>([]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    folderPathHistoryRef.current = folderPathHistory;
  }, [folderPathHistory]);

  const persistOperatorLocation = (land: Land, history: BreadcrumbItem[]) => {
    window.localStorage.setItem(LAND_STORAGE_KEY, land.id);
    window.localStorage.setItem(
      OPERATOR_LOCATION_STORAGE_KEY,
      JSON.stringify({
        landId: land.id,
        folderPathHistory: history,
      })
    );
  };

  const clearOperatorFolderLocation = (land: Land) => {
    persistOperatorLocation(land, []);
  };

  const clearOperatorLocation = () => {
    window.localStorage.removeItem(LAND_STORAGE_KEY);
    window.localStorage.removeItem(OPERATOR_LOCATION_STORAGE_KEY);
  };

  const loadLands = useCallback(
    async ({
      preferSavedLocation = false,
      showError = false,
    }: { preferSavedLocation?: boolean; showError?: boolean } = {}) => {
      const requestId = landsRequestIdRef.current + 1;
      landsRequestIdRef.current = requestId;

      try {
        console.log("[operator-debug][OperatorPage] loadLands:start");

        const activeLands = await getLands();

        if (!isMountedRef.current || landsRequestIdRef.current !== requestId) return;

        console.log("[operator-debug][OperatorPage] loadLands:result", {
          length: activeLands.length,
          lands: activeLands,
        });

        setLands(activeLands);

        const savedLocation = readOperatorLocation();
        const savedLandId =
          savedLocation?.landId ?? window.localStorage.getItem(LAND_STORAGE_KEY);

        setSelectedLand((currentLand) => {
          const preferredLandId = preferSavedLocation
            ? savedLandId
            : currentLand?.id ?? savedLandId;
          const nextSelectedLand =
            activeLands.find((land) => land.id === preferredLandId) ??
            activeLands[0] ??
            null;

          console.log("[operator-debug][OperatorPage] land sync selection", {
            preferSavedLocation,
            savedLandId,
            currentLand,
            nextSelectedLand,
            firstLand: activeLands[0] ?? null,
          });

          if (!nextSelectedLand) {
            clearOperatorLocation();
            setCurrentFolder(null);
            setFolderPathHistory([]);
            setSearchQuery("");
            setFolders([]);
            setDocuments([]);
            return null;
          }

          const shouldKeepCurrentFolder =
            currentLand?.id === nextSelectedLand.id ||
            (preferSavedLocation && savedLocation?.landId === nextSelectedLand.id);
          const nextHistory = shouldKeepCurrentFolder
            ? preferSavedLocation
              ? savedLocation?.folderPathHistory ?? []
              : folderPathHistoryRef.current
            : [];

          if (!shouldKeepCurrentFolder) {
            setSearchQuery("");
          }

          setFolderPathHistory(nextHistory);
          setCurrentFolder(nextHistory[nextHistory.length - 1] ?? null);
          persistOperatorLocation(nextSelectedLand, nextHistory);

          if (
            currentLand?.id === nextSelectedLand.id &&
            currentLand.name === nextSelectedLand.name &&
            currentLand.description === nextSelectedLand.description &&
            currentLand.is_active === nextSelectedLand.is_active
          ) {
            return currentLand;
          }

          return nextSelectedLand;
        });
      } catch (error) {
        if (showError && isMountedRef.current) {
          setError(error instanceof Error ? error.message : "Gagal memuat card");
        }
        console.error("Failed to load lands", error);
      }
    },
    []
  );

  useEffect(() => {
    loadLands({ preferSavedLocation: true, showError: true });
  }, [loadLands]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadLands();
    }, LAND_REFRESH_INTERVAL_MS);

    const handleWindowFocus = () => {
      loadLands();
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadLands]);

  const handleLandChange = (land: Land) => {
    console.log("[operator-debug][OperatorPage] handleLandChange", {
      id: land.id,
      isUuid:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          land.id
        ),
      land,
    });

    setSelectedLand(land);
    setCurrentFolder(null);
    setFolderPathHistory([]);
    setSearchQuery("");
    clearOperatorFolderLocation(land);
  };

  const loadWorkspaceData = useCallback(
    async ({ showLoading = true }: { showLoading?: boolean } = {}) => {
      const requestId = workspaceRequestIdRef.current + 1;
      workspaceRequestIdRef.current = requestId;

      if (!selectedLand) {
        console.log("[operator-debug][OperatorPage] loadWorkspaceData:skip no selectedLand", {
          selectedLand,
        });
        setFolders([]);
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      try {
        if (showLoading) {
          setIsLoading(true);
        }
        setError("");

        const search = searchQuery.trim();
        const folderParentId = search ? null : currentFolder?.id ?? null;

        console.log("[operator-debug][OperatorPage] loadWorkspaceData:start", {
          selectedLand,
          selectedLandId: selectedLand.id,
          selectedLandIdIsUuid:
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              selectedLand.id
            ),
          currentFolder,
          search,
          folderParentId,
          showLoading,
          folderArgs: {
            landId: selectedLand.id,
            parentId: folderParentId,
            includeAll: Boolean(search),
            search,
          },
          documentArgs: {
            landId: selectedLand.id,
            folderId: folderParentId,
            search,
          },
        });

        const [landFolders, landDocuments] = await Promise.all([
          getFolders({
            landId: selectedLand.id,
            parentId: folderParentId,
            includeAll: Boolean(search),
            search,
          }),
          getDocuments({
            landId: selectedLand.id,
            folderId: folderParentId,
            search,
          }),
        ]);

        if (!isMountedRef.current || workspaceRequestIdRef.current !== requestId) return;

        console.log("[operator-debug][OperatorPage] loadWorkspaceData:result before setState", {
          foldersIsArray: Array.isArray(landFolders),
          foldersLength: landFolders.length,
          folders: landFolders,
          documentsIsArray: Array.isArray(landDocuments),
          documentsLength: landDocuments.length,
          documents: landDocuments,
        });

        setFolders(landFolders);
        setDocuments(landDocuments);

        console.log("[operator-debug][OperatorPage] setState called", {
          foldersLength: landFolders.length,
          documentsLength: landDocuments.length,
        });
      } catch (error) {
        console.error("Failed to load operator workspace", error);

        if (!isMountedRef.current || workspaceRequestIdRef.current !== requestId) return;

        if (showLoading) {
          setFolders([]);
          setDocuments([]);
          setError(
            error instanceof Error
              ? error.message
              : "Gagal memuat data operator"
          );
        }
      } finally {
        if (isMountedRef.current && workspaceRequestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [currentFolder, searchQuery, selectedLand]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadWorkspaceData();
    }, searchQuery.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadWorkspaceData, searchQuery]);

  useEffect(() => {
    if (!selectedLand) return;

    const intervalId = window.setInterval(() => {
      loadWorkspaceData({ showLoading: false });
    }, WORKSPACE_REFRESH_INTERVAL_MS);

    const handleWindowFocus = () => {
      loadWorkspaceData({ showLoading: false });
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [loadWorkspaceData, selectedLand]);

  const handleEnterFolder = (id: number, name: string) => {
    console.log("[operator-debug][OperatorPage] handleEnterFolder", {
      id,
      name,
    });

    const nextFolder = { id, name };
    const nextHistory = [...folderPathHistory, nextFolder];
    setFolderPathHistory(nextHistory);
    setCurrentFolder(nextFolder);
    setSearchQuery("");

    if (selectedLand) {
      persistOperatorLocation(selectedLand, nextHistory);
    }
  };

  const handleNavigateBreadcrumb = (index: number) => {
    console.log("[operator-debug][OperatorPage] handleNavigateBreadcrumb", {
      index,
      folderPathHistory,
    });

    setSearchQuery("");

    if (index === -1) {
      setFolderPathHistory([]);
      setCurrentFolder(null);
      if (selectedLand) {
        clearOperatorFolderLocation(selectedLand);
      }
      return;
    }

    const nextHistory = folderPathHistory.slice(0, index + 1);
    setFolderPathHistory(nextHistory);
    setCurrentFolder(nextHistory[index] ?? null);
    if (selectedLand) {
      persistOperatorLocation(selectedLand, nextHistory);
    }
  };

  console.log("[operator-debug][OperatorPage] render", {
    selectedLand,
    selectedLandId: selectedLand?.id ?? null,
    selectedLandIdIsUuid: selectedLand
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          selectedLand.id
        )
      : false,
    landsLength: lands.length,
    foldersLength: folders.length,
    documentsLength: documents.length,
    currentFolder,
    searchQuery,
    isLoading,
    error,
    documentListProps: {
      folders,
      documents,
      isLoading,
      error,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <OperatorHeader selectedLand={selectedLand?.name ?? ""} />

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <LandSelector
          value={selectedLand}
          lands={lands}
          onChange={handleLandChange}
        />

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {folderPathHistory.length > 0 && !searchQuery && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
            <button
              onClick={() => handleNavigateBreadcrumb(-1)}
              className="font-semibold text-emerald-700 transition hover:text-emerald-800"
              type="button"
            >
              Home
            </button>

            {folderPathHistory.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <span className="text-slate-400">/</span>

                <button
                  onClick={() => handleNavigateBreadcrumb(index)}
                  className="font-semibold text-slate-800 transition enabled:text-emerald-700 enabled:hover:text-emerald-800"
                  disabled={index === folderPathHistory.length - 1}
                  type="button"
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        )}

        <DocumentList
          folders={folders}
          documents={documents}
          isLoading={isLoading}
          error={error}
          onEnterFolder={handleEnterFolder}
        />
      </div>
    </main>
  );
}
