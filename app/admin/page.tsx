'use client'

import { useState, useMemo, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'
import { DocumentCard } from '@/components/document-card'
import { SearchBar } from '@/components/search-bar'
import { UploadDialog } from '@/components/upload-dialog'
import { FolderCard } from '@/components/folder-card'
import { CreateFolderDialog } from '@/components/create-folder-dialog'
import { AppHeader } from '@/components/app-header'
import { getLands, type Land } from '@/lib/services/land'

interface Document {
  id: string
  title: string
  description: string
  category: string
  type: string
  file: {
    name: string
    path: string
    size?: number
  }
}

interface Folder {
  id: number
  name: string
  parent_id: number | null
}

interface BreadcrumbItem {
  id: number
  name: string
}

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLand, setSelectedLand] = useState<Land | null>(null)
  const [showLandList, setShowLandList] = useState(true)
  const [lands, setLands] = useState<Land[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem | null>(null)
  const [folderPathHistory, setFolderPathHistory] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadLands() {
      try {
        const data = await getLands()

        console.log('[ADMIN]', {
  currentFolder,
  folderPathHistory
})
        if (!mounted) return

        setLands(data)

        // Jangan pilih land otomatis
        setSelectedLand(null)
      } catch (err) {
        console.error(err)
      }
    }

    loadLands()

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
  }
  
  // Fetch documents and folders whenever the current folder or search changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchWorkspaceData(searchQuery.trim())
    }, searchQuery.trim() ? 300 : 0)

    return () => window.clearTimeout(timeoutId)
  }, [selectedLand, showLandList, currentFolder, searchQuery])

  const fetchWorkspaceData = async (searchTerm = '') => {
  console.log("FETCH WORKSPACE")
  console.log("selectedLand =", selectedLand)
  console.log("selectedLand =", selectedLand);
  console.log("showLandList =", showLandList);

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
        landId: selectedLand.id
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

  const handleDeleteSuccess = (deletedId: string) => {
    setDocuments(documents.filter(doc => doc.id !== deletedId))
  }

const handleEnterFolder = (id: number, name: string) => {
  console.log("MASUK FOLDER", id, name)

  const newHistory = [...folderPathHistory, { id, name }]

  setFolderPathHistory(newHistory)
  setCurrentFolder({ id, name })
}

  const handleNavigateBreadcrumb = (index: number) => {
  if (index === -1) {
    setShowLandList(true)
    setSelectedLand(null)
    setCurrentFolder(null)
    setFolderPathHistory([])
    return
  }

  const newHistory = folderPathHistory.slice(0, index + 1)

  console.log("NEW HISTORY", newHistory)
  console.log("TARGET FOLDER", newHistory[newHistory.length - 1])

  setFolderPathHistory(newHistory)
  setCurrentFolder(newHistory[newHistory.length - 1])
}

  const handleNavigateLandRoot = () => {
    setCurrentFolder(null)
    setFolderPathHistory([])
  }

  const handleFolderDeleteSuccess = () => {
    fetchFolders()
  }

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
      <AppHeader>
        <CreateFolderDialog 
          parentId={currentFolder ? currentFolder.id : null}
          landId={selectedLand?.id ?? ""}
          onCreateSuccess={fetchFolders}
        />
        <UploadDialog 
          folderId={currentFolder ? currentFolder.id : null}
          landId={selectedLand?.id ?? ""}
          onUploadSuccess={handleUploadSuccess}
        />
      </AppHeader>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari folder atau dokumen berdasarkan nama..."
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
      className={`font-semibold transition-colors ${
        folderPathHistory.length === 0
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
          className={`font-semibold transition-colors ${
            index === folderPathHistory.length - 1
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
    {lands.map((land) => (
      <div
        key={land.id}
        onClick={() => handleEnterLand(land)}
        className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all"
      >
        <h3 className="text-lg font-semibold text-gray-900">
          📁 {land.name}
        </h3>

        <p className="text-sm text-gray-500 mt-2">
          Klik untuk membuka
        </p>
      </div>
    ))}
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
                  title={doc.title}
                  description={doc.description}
                  category={doc.category}
                  type={doc.type}
                  file={doc.file}
                  onDelete={handleDeleteSuccess}
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
