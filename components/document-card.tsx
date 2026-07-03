import { useState, type CSSProperties } from 'react'
import {
  Eye,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideoCamera,
  HardDrive,
  Loader2,
  MonitorUp,
  Presentation,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISPLAY_DOCUMENT_STORAGE_KEY = 'futaba.display.document'

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
  showOperatorActions?: boolean
}

interface FileIconMeta {
  Icon: LucideIcon
  containerClassName: string
  iconClassName: string
  labelClassName: string
  containerStyle: CSSProperties
  iconStyle: CSSProperties
  labelStyle: CSSProperties
}

const extensionGroups = {
  spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
  presentation: ['ppt', 'pptx', 'odp'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
  video: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz'],
  code: ['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'sql'],
}

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

function getFileIconMeta(type: string, fileName: string): FileIconMeta {
  const normalizedType = type.toLowerCase()
  const extension = getFileExtension(fileName)

  if (normalizedType.includes('pdf') || extension === 'pdf') {
    return {
      Icon: FileText,
      containerClassName: 'bg-[#fef2f2] group-hover:bg-[#fee2e2]',
      iconClassName: 'text-[#dc2626]',
      labelClassName: 'bg-[#fef2f2] text-[#b91c1c]',
      containerStyle: { backgroundColor: '#fef2f2' },
      iconStyle: { color: '#dc2626' },
      labelStyle: { backgroundColor: '#fef2f2', color: '#b91c1c' },
    }
  }

  if (
    normalizedType.includes('spreadsheet') ||
    normalizedType.includes('excel') ||
    extensionGroups.spreadsheet.includes(extension)
  ) {
    return {
      Icon: FileSpreadsheet,
      containerClassName: 'bg-[#ecfdf5] group-hover:bg-[#d1fae5]',
      iconClassName: 'text-[#059669]',
      labelClassName: 'bg-[#ecfdf5] text-[#047857]',
      containerStyle: { backgroundColor: '#ecfdf5' },
      iconStyle: { color: '#059669' },
      labelStyle: { backgroundColor: '#ecfdf5', color: '#047857' },
    }
  }

  if (
    normalizedType.includes('presentation') ||
    normalizedType.includes('powerpoint') ||
    extensionGroups.presentation.includes(extension)
  ) {
    return {
      Icon: Presentation,
      containerClassName: 'bg-[#fff7ed] group-hover:bg-[#ffedd5]',
      iconClassName: 'text-[#ea580c]',
      labelClassName: 'bg-[#fff7ed] text-[#c2410c]',
      containerStyle: { backgroundColor: '#fff7ed' },
      iconStyle: { color: '#ea580c' },
      labelStyle: { backgroundColor: '#fff7ed', color: '#c2410c' },
    }
  }

  if (normalizedType.startsWith('image/') || extensionGroups.image.includes(extension)) {
    return {
      Icon: FileImage,
      containerClassName: 'bg-[#ecfeff] group-hover:bg-[#cffafe]',
      iconClassName: 'text-[#0891b2]',
      labelClassName: 'bg-[#ecfeff] text-[#0e7490]',
      containerStyle: { backgroundColor: '#ecfeff' },
      iconStyle: { color: '#0891b2' },
      labelStyle: { backgroundColor: '#ecfeff', color: '#0e7490' },
    }
  }

  if (normalizedType.startsWith('video/') || extensionGroups.video.includes(extension)) {
    return {
      Icon: FileVideoCamera,
      containerClassName: 'bg-[#f5f3ff] group-hover:bg-[#ede9fe]',
      iconClassName: 'text-[#7c3aed]',
      labelClassName: 'bg-[#f5f3ff] text-[#6d28d9]',
      containerStyle: { backgroundColor: '#f5f3ff' },
      iconStyle: { color: '#7c3aed' },
      labelStyle: { backgroundColor: '#f5f3ff', color: '#6d28d9' },
    }
  }

  if (
    normalizedType.includes('zip') ||
    normalizedType.includes('compressed') ||
    normalizedType.includes('archive') ||
    extensionGroups.archive.includes(extension)
  ) {
    return {
      Icon: FileArchive,
      containerClassName: 'bg-[#fffbeb] group-hover:bg-[#fef3c7]',
      iconClassName: 'text-[#d97706]',
      labelClassName: 'bg-[#fffbeb] text-[#b45309]',
      containerStyle: { backgroundColor: '#fffbeb' },
      iconStyle: { color: '#d97706' },
      labelStyle: { backgroundColor: '#fffbeb', color: '#b45309' },
    }
  }

  if (normalizedType.includes('json') || normalizedType.includes('xml') || extensionGroups.code.includes(extension)) {
    return {
      Icon: FileCode,
      containerClassName: 'bg-[#f1f5f9] group-hover:bg-[#e2e8f0]',
      iconClassName: 'text-[#334155]',
      labelClassName: 'bg-[#f1f5f9] text-[#334155]',
      containerStyle: { backgroundColor: '#f1f5f9' },
      iconStyle: { color: '#334155' },
      labelStyle: { backgroundColor: '#f1f5f9', color: '#334155' },
    }
  }

  return {
    Icon: FileText,
    containerClassName: 'bg-[#dbeafe] group-hover:bg-[#bfdbfe]',
    iconClassName: 'text-[#2563eb]',
    labelClassName: 'bg-[#eff6ff] text-[#1d4ed8]',
    containerStyle: { backgroundColor: '#dbeafe' },
    iconStyle: { color: '#2563eb' },
    labelStyle: { backgroundColor: '#eff6ff', color: '#1d4ed8' },
  }
}

function getTypeLabel(type: string, fileName: string) {
  const extension = getFileExtension(fileName)
  if (extension) return extension.toUpperCase()

  const subtype = type.split('/').at(-1)
  return subtype ? subtype.toUpperCase() : 'FILE'
}

function formatFileSize(size?: number) {
  if (typeof size !== 'number' || Number.isNaN(size) || size <= 0) {
    return 'Ukuran tidak tersedia'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const formattedValue = value >= 10 || unitIndex === 0
    ? Math.round(value).toString()
    : value.toFixed(1)

  return `${formattedValue} ${units[unitIndex]}`
}

export function DocumentCard({
  id,
  title,
  description,
  category,
  type,
  file,
  onDelete,
  showOperatorActions = false
}: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [isDisplaying, setIsDisplaying] = useState(false)
  const fileIconMeta = getFileIconMeta(type, file.name)
  const TypeIcon = fileIconMeta.Icon

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

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleView()
  }

  const handleShowOnDisplay = async (e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      setIsDisplaying(true)

      const displayDocument = {
        id,
        title,
        description,
        category,
        type,
        file,
        updatedAt: Date.now(),
      }

      const response = await fetch('/api/display-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(displayDocument),
      })

      if (!response.ok) {
        throw new Error('Gagal mengirim dokumen ke display')
      }

      const data = await response.json()
      const nextDisplayDocument = data.document ?? displayDocument

      window.localStorage.setItem(
        DISPLAY_DOCUMENT_STORAGE_KEY,
        JSON.stringify(nextDisplayDocument)
      )

      window.dispatchEvent(
        new CustomEvent('futaba-display-document-change', {
          detail: nextDisplayDocument,
        })
      )
    } catch (error) {
      console.error('Display error:', error)
      alert(error instanceof Error ? error.message : 'Gagal menampilkan dokumen di display')
    } finally {
      window.setTimeout(() => setIsDisplaying(false), 600)
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
      onClick={showOperatorActions ? undefined : handleView}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all group select-none text-gray-900 ${
        showOperatorActions ? '' : 'cursor-pointer'
      }`}
      title={showOperatorActions ? undefined : 'Klik kartu ini untuk melihat/membuka dokumen'}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Main Content Area */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-lg transition-colors ${fileIconMeta.containerClassName}`}
              style={fileIconMeta.containerStyle}
            >
              <TypeIcon
                className={`w-6 h-6 ${fileIconMeta.iconClassName}`}
                style={fileIconMeta.iconStyle}
              />
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
              <span
                className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${fileIconMeta.labelClassName}`}
                style={fileIconMeta.labelStyle}
              >
                {getTypeLabel(type, file.name)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate">{file.name}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-gray-400" />
                {formatFileSize(file.size)}
              </span>
            </div>
          </div>
        </div>

        {showOperatorActions && (
          <div className="grid w-full grid-cols-1 gap-2 border-t border-[#e5e7eb] pt-3 sm:flex sm:w-auto sm:flex-shrink-0 sm:self-start sm:border-t-0 sm:pt-0">
            <button
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold sm:w-40"
              onClick={handlePreviewClick}
              disabled={isViewing}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
              }}
              title="Preview Dokumen"
              type="button"
            >
              {isViewing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">Preview</span>
            </button>

            <button
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-sm font-semibold sm:w-40"
              onClick={handleShowOnDisplay}
              disabled={isDisplaying}
              style={{
                backgroundColor: '#059669',
                border: '1px solid #059669',
                color: '#ffffff',
              }}
              title="Tampilkan di Display"
              type="button"
            >
              {isDisplaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MonitorUp className="w-4 h-4" />
              )}
              <span className="text-xs font-medium">Tampilkan</span>
            </button>
          </div>
        )}

        {onDelete && (
          <div className="flex gap-2 sm:flex-shrink-0 self-end sm:self-start justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
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
          </div>
        )}
      </div>
    </div>
  )
}
