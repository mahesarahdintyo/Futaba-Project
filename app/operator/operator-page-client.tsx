"use client";

import OperatorHeader from "@/components/operator/OperatorHeader";
import LandSelector from "@/components/operator/LandSelector";
import SearchBar from "@/components/operator/SearchBar";
import DocumentList from "@/components/operator/DocumentList";
import { getDocuments, type Document } from "@/lib/services/document";
import { getFolders, type Folder } from "@/lib/services/folder";
import { getLands, type Land } from "@/lib/services/land";
import { useEffect, useState } from "react";

const LAND_STORAGE_KEY = "futaba.operator.selectedLand";
const OPERATOR_LOCATION_STORAGE_KEY = "futaba.operator.location";

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

  useEffect(() => {
    let isMounted = true;

    async function loadLands() {
      try {
        console.log("[operator-debug][OperatorPage] loadLands:start");

        const activeLands = await getLands();

        if (!isMounted) return;

        console.log("[operator-debug][OperatorPage] loadLands:result", {
          length: activeLands.length,
          lands: activeLands,
        });

        setLands(activeLands);

        const savedLocation = readOperatorLocation();
        const savedLandId =
          savedLocation?.landId ?? window.localStorage.getItem(LAND_STORAGE_KEY);
        const savedLand = activeLands.find((land) => land.id === savedLandId);

        console.log("[operator-debug][OperatorPage] saved land lookup", {
          savedLandId,
          savedLand,
          firstLand: activeLands[0] ?? null,
        });

        if (savedLand) {
          const nextHistory = savedLocation?.folderPathHistory ?? [];

          console.log("[operator-debug][OperatorPage] selectedLand from localStorage", {
            id: savedLand.id,
            isUuid:
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                savedLand.id
              ),
            land: savedLand,
          });
          setSelectedLand(savedLand);
          setFolderPathHistory(nextHistory);
          setCurrentFolder(nextHistory[nextHistory.length - 1] ?? null);
          return;
        }

        if (activeLands[0]) {
          console.log("[operator-debug][OperatorPage] selectedLand from first land", {
            id: activeLands[0].id,
            isUuid:
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                activeLands[0].id
              ),
            land: activeLands[0],
          });
          setSelectedLand(activeLands[0]);
        }
      } catch (error) {
        if (isMounted) {
          setError(error instanceof Error ? error.message : "Gagal memuat card");
        }
        console.error("Failed to load lands", error);
      }
    }

    loadLands();

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      loadWorkspaceData();
    }, searchQuery.trim() ? 300 : 0);

    async function loadWorkspaceData() {
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
        setIsLoading(true);
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

        if (!isMounted) return;

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

        if (isMounted) {
          setFolders([]);
          setDocuments([]);
          setError(
            error instanceof Error
              ? error.message
              : "Gagal memuat data operator"
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [currentFolder, searchQuery, selectedLand]);

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
