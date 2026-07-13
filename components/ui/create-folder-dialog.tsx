'use client'

import { useState } from 'react'
import { FolderPlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateFolderDialogProps {
  parentId: number | null
  landId: string
  onCreateSuccess?: () => void
}

export function CreateFolderDialog({
  parentId,
  landId,
  onCreateSuccess
}: CreateFolderDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nama folder tidak boleh kosong')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name.trim(),
          parentId,
          landId
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal membuat folder')
      }

      // Reset form
      setName('')
      setIsOpen(false)

      if (onCreateSuccess) {
        onCreateSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat folder')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-gray-300 hover:bg-gray-50 w-full sm:w-auto flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-gray-700 bg-white text-sm font-medium"
      >
        <FolderPlus className="w-4 h-4 text-yellow-600" />
        New Folder
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Buat Folder Baru
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Folder *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dokumen SOP, Keuangan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="flex-1 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Membuat...
                    </>
                  ) : (
                    'Buat Folder'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
