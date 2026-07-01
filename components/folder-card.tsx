'use client'

import { Folder, Trash2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface FolderCardProps {
  id: number
  name: string
  onEnter: (id: number, name: string) => void
  onDeleteSuccess?: () => void
}

export function FolderCard({
  id,
  name,
  onEnter,
  onDeleteSuccess
}: FolderCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  console.log("[operator-debug][FolderCard] render", {
    id,
    name,
    hasOnEnter: typeof onEnter === "function",
    hasOnDeleteSuccess: typeof onDeleteSuccess === "function",
  })

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent entering the folder
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus folder "${name}" beserta semua isinya?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/folders?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus folder')
      }

      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (error) {
      console.error('Delete folder error:', error)
      alert('Gagal menghapus folder')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
<div
  onClick={() => {
    console.log("CLICK FOLDER", id, name)
    onEnter(id, name)
  }}
  className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex items-center justify-between text-gray-900"
  title={`Klik untuk masuk ke folder ${name}`}
>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
          <Folder className="w-5 h-5 text-yellow-600 fill-yellow-600" />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {name}
          </h4>
          <p className="text-xs text-gray-500">Folder</p>
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Hapus Folder"
      >
        {isDeleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  )
}
