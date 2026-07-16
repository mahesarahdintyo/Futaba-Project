'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DocumentCard } from '@/components/ui/document-card'
import { SearchBar } from '@/components/ui/search-bar'
import { UploadDialog } from '@/components/ui/upload-dialog'
import { FolderCard } from '@/components/ui/folder-card'
import { CreateFolderDialog } from '@/components/ui/create-folder-dialog'
import { CreateLandDialog } from '@/components/admin/CreateLandDialog'
import { AdminLandCard } from '@/components/admin/AdminLandCard'
import { AppHeader } from '@/components/ui/app-header'
import { LogoutButton } from '@/components/ui/logout-button'
import { getLands, type Land } from '@/lib/services/land'
import ProductionReportsDashboard from '@/components/admin/ProductionReportsDashboard'
import AdminPartNumbersPanel from '@/components/admin/AdminPartNumbersPanel'
import AdminNgCategoriesPanel from '@/components/admin/AdminNgCategoriesPanel'

interface Document {
  id: string
  landId?: string
  title: string
  description: string
  category: string
  type: string
  file: {
    name: string
    path: string
    size?: number
  }
  targetTime?: string | null
  hiddenFromOperator?: boolean
}

interface Folder {
  id: number
  name: string
  parent_id: number | null
  item_count?: number
}

interface BreadcrumbItem {
  id: number
  name: string
}

interface AdminLocationState {
  landId: string
  folderPathHistory: BreadcrumbItem[]
}

const ADMIN_LOCATION_STORAGE_KEY = 'futaba.admin.location'

function readAdminLocation(): AdminLocationState | null {
  try {
    const rawLocation = window.localStorage.getItem(ADMIN_LOCATION_STORAGE_KEY)
    if (!rawLocation) return null

    const location = JSON.parse(rawLocation) as Partial<AdminLocationState>
    const folderPathHistory = Array.isArray(location.folderPathHistory)
      ? location.folderPathHistory.filter(
        (folder): folder is BreadcrumbItem =>
          typeof folder?.id === 'number' && typeof folder?.name === 'string'
      )
      : []

    if (typeof location.landId !== 'string') {
      return null
    }

    return {
      landId: location.landId,
      folderPathHistory,
    }
  } catch {
    return null
  }
}

interface AdminPageProps {
  initialLands?: Land[]
}

export default function Page({ initialLands = [] }: AdminPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLand, setSelectedLand] = useState<Land | null>(null)
  const [showLandList, setShowLandList] = useState(true)
  const [lands, setLands] = useState<Land[]>(initialLands)
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem | null>(null)
  const [folderPathHistory, setFolderPathHistory] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(initialLands.length === 0)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState<'workspace' | 'reports' | 'part-numbers' | 'ng-categories'>('workspace')

  const persistAdminLocation = (land: Land, history: BreadcrumbItem[]) => {
    window.localStorage.setItem(
      ADMIN_LOCATION_STORAGE_KEY,
      JSON.stringify({
        landId: land.id,
        folderPathHistory: history,
      })
    )
  }

  const clearAdminLocation = () => {
    window.localStorage.removeItem(ADMIN_LOCATION_STORAGE_KEY)
  }

  const loadLands = async () => {
    try {
      setIsLoading(true)
      const data = await getLands({ includeHidden: true })

      setLands(data)
      setSelectedLand(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data card')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    async function loadInitialLands() {
      try {
        setIsLoading(true)
        const data = await getLands({ includeHidden: true })
        if (!mounted) return

        setLands(data)

        const savedLocation = readAdminLocation()
        const savedLand = savedLocation
          ? data.find((land) => land.id === savedLocation.landId)
          : null

        if (savedLand && savedLocation) {
          const nextHistory = savedLocation.folderPathHistory

          setSelectedLand(savedLand)
          setShowLandList(false)
          setFolderPathHistory(nextHistory)
          setCurrentFolder(nextHistory[nextHistory.length - 1] ?? null)
          setSearchQuery('')
          return
        }

        clearAdminLocation()
        setSelectedLand(null)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Gagal mengambil data card')
        }
        console.error(err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialLands()

    return () => {
      mounted = false
    }
  }, [])

  const handleEnterLand = (land: Land) => {
    setSelectedLand(land)
    setShowLandList(false)

    setCurrentFolder(null)
    setFolderPathHistory([])
    setSearchQuery('')
    persistAdminLocation(land, [])
  }

  // Fetch documents and folders whenever the current folder or search changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchWorkspaceData(searchQuery.trim())
    }, searchQuery.trim() ? 300 : 0)

    return () => window.clearTimeout(timeoutId)
  }, [selectedLand, showLandList, currentFolder, searchQuery])

  const fetchWorkspaceData = async (searchTerm = '') => {
    if (showLandList || !selectedLand) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError('')

      await Promise.all([
        fetchDocuments(searchTerm),
        fetchFolders(searchTerm)
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDocuments = async (searchTerm = searchQuery.trim()) => {
    if (!selectedLand) return

    try {
      const params = new URLSearchParams({
        landId: selectedLand.id,
        includeHidden: 'true'
      })

      if (searchTerm) {
        params.set('search', searchTerm)
      } else if (currentFolder) {
        params.set('folderId', currentFolder.id.toString())
      }

      const url = `/api/documents?${params.toString()}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Gagal mengambil data dokumen')
      }

      const data = await response.json()
      setDocuments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching documents')
      console.error('[v0] Error fetching documents:', err)
    }
  }

  const fetchFolders = async (searchTerm = searchQuery.trim()) => {
    if (!selectedLand) return

    try {
      const params = new URLSearchParams({
        landId: selectedLand.id
      })

      if (searchTerm) {
        params.set('search', searchTerm)
        params.set('includeAll', 'true')
      } else if (currentFolder) {
        params.set('parentId', currentFolder.id.toString())
      }

      const url = `/api/folders?${params.toString()}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Gagal mengambil data folder')
      }

      const data = await response.json()
      setFolders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching folders')
      console.error('[v0] Error fetching folders:', err)
    }
  }

  const handleUploadSuccess = () => {
    fetchWorkspaceData()
  }

  const handleCreateFolderSuccess = () => {
    fetchWorkspaceData()
  }

  const handleDeleteSuccess = (deletedId: string) => {
    setDocuments(documents.filter(doc => doc.id !== deletedId))
  }

  const handleVisibilityChange = (documentId: string, hiddenFromOperator: boolean) => {
    setDocuments((currentDocuments) =>
      currentDocuments.map((doc) =>
        doc.id === documentId
          ? { ...doc, hiddenFromOperator }
          : doc
      )
    )
  }

  const handleEnterFolder = (id: number, name: string) => {
    const newHistory = [...folderPathHistory, { id, name }]

    setFolderPathHistory(newHistory)
    setCurrentFolder({ id, name })
    setSearchQuery('')

    if (selectedLand) {
      persistAdminLocation(selectedLand, newHistory)
    }
  }

  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1) {
      setShowLandList(true)
      setSelectedLand(null)
      setCurrentFolder(null)
      setFolderPathHistory([])
      setSearchQuery('')
      clearAdminLocation()
      return
    }

    const newHistory = folderPathHistory.slice(0, index + 1)

    setFolderPathHistory(newHistory)
    setCurrentFolder(newHistory[newHistory.length - 1])
    setSearchQuery('')

    if (selectedLand) {
      persistAdminLocation(selectedLand, newHistory)
    }
  }

  const handleNavigateLandRoot = () => {
    setCurrentFolder(null)
    setFolderPathHistory([])
    setSearchQuery('')

    if (selectedLand) {
      persistAdminLocation(selectedLand, [])
    }
  }

  const handleFolderDeleteSuccess = () => {
    fetchFolders()
  }

  const filteredLands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return lands

    return lands.filter((land) => {
      return (
        land.name.toLowerCase().includes(query) ||
        (land.description || '').toLowerCase().includes(query)
      )
    })
  }, [searchQuery, lands])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file.name.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })
  }, [searchQuery, documents])

  // Filter folders by search query (only at UI level when searching)
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders
    return folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery, folders])

  const showEmptyState = filteredDocuments.length === 0 && filteredFolders.length === 0

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <AppHeader
        logoAside={
          <div className="hidden sm:flex flex-wrap items-center gap-1 sm:gap-1.5 ml-2 sm:ml-4 border-l border-gray-200 pl-2 sm:pl-4 select-none">
            <button
              onClick={() => setActiveView('workspace')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 cursor-pointer ${activeView === 'workspace'
                  ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              Workspace
            </button>
            <button
              onClick={() => setActiveView('reports')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 cursor-pointer ${activeView === 'reports'
                  ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              Laporan Produksi
            </button>
            <button
              onClick={() => setActiveView('part-numbers')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 cursor-pointer ${activeView === 'part-numbers'
                  ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              Part Number
            </button>
            <button
              onClick={() => setActiveView('ng-categories')}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 cursor-pointer ${activeView === 'ng-categories'
                  ? 'bg-rose-50 text-rose-700 font-extrabold border border-rose-100'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
            >
              Kategori NG
            </button>
            <Link
              href="/admin/recycle-bin"
              className="px-3 py-1.5 rounded-lg text-sm font-bold transition duration-200 cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Tempat Sampah
            </Link>
          </div>
        }
      >
        {activeView === 'workspace' && (
          showLandList ? (
            <CreateLandDialog onCreateSuccess={loadLands} />
          ) : selectedLand ? (
            <>
              <CreateFolderDialog
                parentId={currentFolder ? currentFolder.id : null}
                landId={selectedLand.id}
                onCreateSuccess={handleCreateFolderSuccess}
              />
              <UploadDialog
                folderId={currentFolder ? currentFolder.id : null}
                landId={selectedLand.id}
                onUploadSuccess={handleUploadSuccess}
              />
            </>
          ) : null
        )}
        <LogoutButton variant="header" />
      </AppHeader>

      {/* Mobile Nav Tabs - visible only on small screens */}
      <nav className="sm:hidden bg-white border-b border-gray-200 px-3 py-2 flex flex-wrap gap-1.5 shadow-sm">
        <button
          onClick={() => setActiveView('workspace')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
            activeView === 'workspace'
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Workspace
        </button>
        <button
          onClick={() => setActiveView('reports')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
            activeView === 'reports'
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Laporan
        </button>
        <button
          onClick={() => setActiveView('part-numbers')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
            activeView === 'part-numbers'
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Part Number
        </button>
        <button
          onClick={() => setActiveView('ng-categories')}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer ${
            activeView === 'ng-categories'
              ? 'bg-rose-50 text-rose-700 border border-rose-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          Kategori NG
        </button>
        <Link
          href="/admin/recycle-bin"
          className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition duration-200 cursor-pointer text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Sampah
        </Link>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeView === 'reports' ? (
          <ProductionReportsDashboard />
        ) : activeView === 'part-numbers' ? (
          <AdminPartNumbersPanel />
        ) : activeView === 'ng-categories' ? (
          <AdminNgCategoriesPanel />
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={
                  showLandList
                    ? 'Cari card berdasarkan nama atau deskripsi...'
                    : 'Cari folder atau dokumen berdasarkan nama...'
                }
              />
            </div>

            {/* Breadcrumb Navigation */}
            {(!showLandList && selectedLand) && (
              <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mb-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm select-none">

                <button
                  onClick={() => handleNavigateBreadcrumb(-1)}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Home
                </button>

                <ChevronRight className="w-4 h-4 text-gray-400" />

                <button
                  onClick={handleNavigateLandRoot}
                  disabled={folderPathHistory.length === 0}
                  className={`font-semibold transition-colors ${folderPathHistory.length === 0
                    ? 'text-gray-800 cursor-default'
                    : 'text-blue-600 hover:text-blue-700'
                    }`}
                >
                  {selectedLand.name}
                </button>

                {folderPathHistory.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-gray-400" />

                    <button
                      onClick={() => handleNavigateBreadcrumb(index)}
                      disabled={index === folderPathHistory.length - 1}
                      className={`font-semibold transition-colors ${index === folderPathHistory.length - 1
                        ? 'text-gray-800 cursor-default'
                        : 'text-blue-600 hover:text-blue-700'
                        }`}
                    >
                      {folder.name}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {showLandList && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {filteredLands.map((land) => (
                  <AdminLandCard
                    key={land.id}
                    land={land}
                    onEnter={handleEnterLand}
                    onChangeSuccess={loadLands}
                  />
                ))}
              </div>
            )}

            {showLandList && !isLoading && filteredLands.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                <p className="text-gray-400 text-lg font-medium">
                  {searchQuery ? 'Tidak ada card yang cocok' : 'Belum ada card'}
                </p>
                {!searchQuery && (
                  <p className="text-gray-400 text-xs mt-1">
                    Buat card baru untuk memulai
                  </p>
                )}
              </div>
            )}

            {/* Folder List Grid */}
            {!showLandList && !isLoading && filteredFolders.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Folder ({filteredFolders.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      id={folder.id}
                      name={folder.name}
                      itemCount={folder.item_count}
                      onEnter={handleEnterFolder}
                      onDeleteSuccess={handleFolderDeleteSuccess}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Documents List */}
            <div className="space-y-3">
              {!showLandList && !isLoading && filteredDocuments.length > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Dokumen ({filteredDocuments.length})
                  </h3>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {!showLandList && isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 mt-4 text-sm">Memuat data...</p>
                </div>
              ) : !showLandList && filteredDocuments.length > 0 ? (
                <div className="space-y-3">
                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      id={doc.id}
                      landId={doc.landId}
                      title={doc.title}
                      description={doc.description}
                      category={doc.category}
                      type={doc.type}
                      file={doc.file}
                      targetTime={doc.targetTime}
                      hiddenFromOperator={doc.hiddenFromOperator}
                      onDelete={handleDeleteSuccess}
                      onVisibilityChange={handleVisibilityChange}
                    />
                  ))}
                </div>
              ) : null}

              {/* Empty State */}
              {!showLandList && !isLoading && showEmptyState && (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-gray-400 text-lg font-medium">
                    {searchQuery ? 'Tidak ada kecocokan pencarian' : 'Folder ini kosong'}
                  </p>
                  {!searchQuery && (
                    <p className="text-gray-400 text-xs mt-1">
                      Buat folder baru atau unggah dokumen di atas untuk memulai
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2026 PKIS. Semua hak dilindungi.
          </p>
        </div>
      </footer>
    </div>
  )
}
