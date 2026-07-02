import { useState } from 'react'
import { FileText, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocumentCardProps {
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
  onDelete?: (id: string) => void | Promise<void>
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }

    return entities[char]
  })

export function DocumentCard({
  id,
  title,
  description,
  category,
  type,
  file,
  onDelete
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isViewing, setIsViewing] = useState(false)

  console.log("[operator-debug][DocumentCard] render", {
    id,
    title,
    description,
    category,
    type,
    file,
    hasOnDelete: typeof onDelete === "function",
  })

  const handleView = async () => {
    try {
      setIsViewing(true)
      
      // Get signed URL from API
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: file.path
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate view link')
      }

      const data = await response.json()
      
      // Open in a new tab to display the file
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('View error:', error)
      alert('Failed to open file preview')
    } finally {
      setIsViewing(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering card's onClick view
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      if (onDelete) {
        await onDelete(id)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div 
      onClick={handleView}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group select-none text-gray-900"
      title="Klik kartu ini untuk melihat/membuka dokumen"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Main Content Area */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {type.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Print / Delete) */}
        <div className="flex gap-2 sm:flex-shrink-0 self-end sm:self-start justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
        
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Hapus Dokumen"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span className="sm:hidden text-xs font-medium">Hapus</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
