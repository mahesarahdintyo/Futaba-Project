'use client'

import { useState } from 'react'
import { Folder, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Land } from '@/lib/services/land'

interface AdminLandCardProps {
  land: Land
  onEnter: (land: Land) => void
  onChangeSuccess?: () => void
}

export function AdminLandCard({
  land,
  onEnter,
  onChangeSuccess,
}: AdminLandCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [name, setName] = useState(land.name)
  const [description, setDescription] = useState(land.description ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const resetEditForm = () => {
    setName(land.name)
    setDescription(land.description ?? '')
    setError('')
  }

  const handleOpenEdit = (event: React.MouseEvent) => {
    event.stopPropagation()
    resetEditForm()
    setIsEditOpen(true)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nama card tidak boleh kosong')
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch('/api/lands', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: land.id,
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Gagal mengubah card')
      }

      setIsEditOpen(false)
      onChangeSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah card')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation()

    if (!window.confirm(`Apakah Anda yakin ingin menghapus card "${land.name}"?`)) {
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/lands?id=${encodeURIComponent(land.id)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Gagal menghapus card')
      }

      onChangeSuccess?.()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus card')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div
        onClick={() => onEnter(land)}
        className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all"
        title={`Klik untuk membuka ${land.name}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {land.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {land.description || 'Klik untuk membuka'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleOpenEdit}
              title="Edit Card"
              aria-label={`Edit card ${land.name}`}
              className="text-gray-500 hover:text-blue-700 hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Hapus Card"
              aria-label={`Hapus card ${land.name}`}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Card
              </h2>
              <button
                onClick={() => setIsEditOpen(false)}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Card *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={isSaving}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !name.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
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
