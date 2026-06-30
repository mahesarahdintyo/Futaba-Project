'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { DocumentCard } from '@/components/document-card'
import { SearchBar } from '@/components/search-bar'
import { UploadDialog } from '@/components/upload-dialog'
import { FolderCard } from '@/components/folder-card'
import { CreateFolderDialog } from '@/components/create-folder-dialog'

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
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem | null>(null)
  const [folderPathHistory, setFolderPathHistory] = useState<BreadcrumbItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch documents and folders whenever the current folder or search changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchWorkspaceData(searchQuery.trim())
    }, searchQuery.trim() ? 300 : 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentFolder, searchQuery])

  const fetchWorkspaceData = async (searchTerm = '') => {
    try {
      setIsLoading(true)
      setError('')
      await Promise.all([fetchDocuments(searchTerm), fetchFolders()])
    } catch (err) {
      console.error('Error fetching workspace data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDocuments = async (searchTerm = searchQuery.trim()) => {
    try {
      const url = searchTerm
        ? `/api/documents?search=${encodeURIComponent(searchTerm)}`
        : currentFolder 
          ? `/api/documents?folderId=${currentFolder.id}` 
          : '/api/documents'
      
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

  const fetchFolders = async () => {
    try {
      const url = currentFolder 
        ? `/api/folders?parentId=${currentFolder.id}` 
        : '/api/folders'
      
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
    fetchDocuments()
  }

  const handleDeleteSuccess = (deletedId: string) => {
    setDocuments(documents.filter(doc => doc.id !== deletedId))
  }

  const handleEnterFolder = (id: number, name: string) => {
    const newHistory = [...folderPathHistory, { id, name }]
    setFolderPathHistory(newHistory)
    setCurrentFolder({ id, name })
  }

  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1) {
      setFolderPathHistory([])
      setCurrentFolder(null)
    } else {
      const newHistory = folderPathHistory.slice(0, index + 1)
      setFolderPathHistory(newHistory)
      setCurrentFolder(folderPathHistory[index])
    }
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
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <Image
                src="/futaba-logo.png"
                alt="FUTABA Logo"
                width={150}
                height={52}
                className="object-contain h-10 sm:h-11 lg:h-12 w-auto"
                priority
              />
              <h1 className="sr-only">PKIS</h1>
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              <CreateFolderDialog 
                parentId={currentFolder ? currentFolder.id : null}
                onCreateSuccess={fetchFolders}
              />
              <UploadDialog 
                folderId={currentFolder ? currentFolder.id : null}
                onUploadSuccess={handleUploadSuccess}
              />
            </div>
          </div>
        </div>
      </header>

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
        {folderPathHistory.length > 0 && (
          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mb-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm select-none">
            <button 
              onClick={() => handleNavigateBreadcrumb(-1)}
              className="hover:text-blue-600 font-semibold transition-colors text-blue-600"
            >
              Home
            </button>
            {folderPathHistory.map((folder, index) => (
              <div key={folder.id} className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <button 
                  onClick={() => handleNavigateBreadcrumb(index)}
                  className={`hover:text-blue-600 font-semibold transition-colors ${
                    index === folderPathHistory.length - 1 ? 'text-gray-800 cursor-default' : 'text-blue-600'
                  }`}
                  disabled={index === folderPathHistory.length - 1}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Folder List Grid */}
        {!isLoading && filteredFolders.length > 0 && (
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
          {!isLoading && filteredDocuments.length > 0 && (
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

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4 text-sm">Memuat data...</p>
            </div>
          ) : filteredDocuments.length > 0 ? (
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
          {!isLoading && showEmptyState && (
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
