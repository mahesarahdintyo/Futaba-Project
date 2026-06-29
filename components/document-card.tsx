import { useState } from 'react'
import { FileText, Loader2, Printer, Trash2 } from 'lucide-react'
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
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isViewing, setIsViewing] = useState(false)

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

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering card's onClick view
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      alert('Failed to open print window')
      return
    }

    try {
      setIsPrinting(true)
      const printUrl = `/api/print-file?filePath=${encodeURIComponent(file.path)}`
      const lowerName = file.name.toLowerCase()
      const lowerType = type.toLowerCase()
      const isImage =
        lowerType.startsWith('image/') ||
        /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(lowerName)
      const safeTitle = escapeHtml(title || file.name)
      const printContent = isImage
        ? `<img class="print-image" src="${printUrl}" alt="${safeTitle}" onerror="document.body.className = 'error'; document.body.textContent = 'Failed to load file.';" />`
        : `<iframe class="print-pdf" src="${printUrl}"></iframe>`

      printWindow.document.open()
      printWindow.document.write(`
        <!doctype html>
        <html>
          <head>
            <title>${safeTitle}</title>
            <style>
              * {
                box-sizing: border-box;
              }

              html,
              body {
                height: 100%;
                margin: 0;
              }

              body {
                background: #eef1f5;
                color: #111827;
                font-family: Arial, sans-serif;
              }

              body.error {
                align-items: center;
                color: #b91c1c;
                display: flex;
                font-family: Arial, sans-serif;
                justify-content: center;
              }

              .print-shell {
                display: grid;
                grid-template-columns: 320px minmax(0, 1fr);
                height: 100vh;
              }

              .print-sidebar {
                background: #ffffff;
                border-right: 1px solid #d1d5db;
                display: flex;
                flex-direction: column;
                gap: 20px;
                padding: 24px;
              }

              .print-title {
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 18px;
              }

              .print-title h1 {
                font-size: 24px;
                line-height: 1.2;
                margin: 0 0 8px;
              }

              .print-title p,
              .setting-value {
                color: #6b7280;
                font-size: 13px;
                margin: 0;
              }

              .print-button {
                align-items: center;
                background: #2563eb;
                border: 0;
                border-radius: 6px;
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                font-size: 15px;
                font-weight: 700;
                justify-content: center;
                min-height: 42px;
                padding: 0 18px;
                width: 100%;
              }

              .print-button:hover {
                background: #1d4ed8;
              }

              .settings {
                display: grid;
                gap: 12px;
              }

              .setting {
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 12px;
              }

              .setting-label {
                color: #374151;
                display: block;
                font-size: 12px;
                font-weight: 700;
                margin-bottom: 6px;
              }

              .print-preview {
                align-items: center;
                display: flex;
                min-height: 100vh;
                overflow: auto;
                padding: 36px;
              }

              .paper {
                background: #ffffff;
                box-shadow: 0 18px 45px rgb(15 23 42 / 18%);
                display: flex;
                height: min(1120px, calc(100vh - 72px));
                justify-content: center;
                margin: auto;
                overflow: hidden;
                padding: 42px;
                width: min(792px, 100%);
              }

              .print-image {
                display: block;
                height: auto;
                margin: 0 auto;
                max-height: 100%;
                max-width: 100%;
                object-fit: contain;
              }

              .print-pdf {
                border: 0;
                display: block;
                height: 100%;
                width: 100%;
              }

              @media (max-width: 800px) {
                .print-shell {
                  grid-template-columns: 1fr;
                }

                .print-sidebar {
                  border-bottom: 1px solid #d1d5db;
                  border-right: 0;
                }

                .print-preview {
                  min-height: auto;
                  padding: 20px;
                }
              }

              @media print {
                body {
                  background: #ffffff;
                }

                .print-sidebar {
                  display: none;
                }

                .print-shell {
                  display: block;
                  height: auto;
                }

                .print-preview {
                  display: block;
                  min-height: auto;
                  overflow: visible;
                  padding: 0;
                }

                .paper {
                  box-shadow: none;
                  height: auto;
                  margin: 0;
                  min-height: 100vh;
                  padding: 0;
                  width: 100%;
                }

                .print-image {
                  max-height: none;
                  page-break-inside: avoid;
                }

                .print-pdf {
                  height: 100vh;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-shell">
              <aside class="print-sidebar">
                <div class="print-title">
                  <h1>Print</h1>
                  <p>${safeTitle}</p>
                </div>
                <button class="print-button" onclick="window.focus(); window.print();">
                  Print
                </button>
                <div class="settings">
                  <div class="setting">
                    <span class="setting-label">Printer</span>
                    <p class="setting-value">Pilih di dialog print browser</p>
                  </div>
                  <div class="setting">
                    <span class="setting-label">Pages</span>
                    <p class="setting-value">All pages</p>
                  </div>
                  <div class="setting">
                    <span class="setting-label">Layout</span>
                    <p class="setting-value">Default document layout</p>
                  </div>
                  <div class="setting">
                    <span class="setting-label">Scale</span>
                    <p class="setting-value">Fit to page</p>
                  </div>
                </div>
              </aside>
              <main class="print-preview">
                <section class="paper">
                  ${printContent}
                </section>
              </main>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch (error) {
      console.error('Print error:', error)
      printWindow.close()
      alert('Failed to print file')
    } finally {
      setIsPrinting(false)
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
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-initial flex items-center justify-center gap-1.5"
            onClick={handlePrint}
            disabled={isPrinting || isViewing}
            title="Print Dokumen"
          >
            {isPrinting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span className="sm:hidden text-xs font-medium">Print</span>
          </Button>
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
      </div>
    </div>
  )
}
