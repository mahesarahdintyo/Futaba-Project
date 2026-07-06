'use client'

import { useEffect, useMemo, useState } from 'react'
import { Clock, FileText, Monitor } from 'lucide-react'

const DISPLAY_DOCUMENT_STORAGE_KEY = 'futaba.display.document'

interface DisplayDocument {
  id: string
  title: string
  description?: string
  category?: string
  type: string
  file: {
    name: string
    path: string
    size?: number
  }
  targetTime?: string | null
  updatedAt?: number
}

function readDisplayDocument(): DisplayDocument | null {
  try {
    const rawDocument = window.localStorage.getItem(DISPLAY_DOCUMENT_STORAGE_KEY)
    if (!rawDocument) return null

    const document = JSON.parse(rawDocument) as Partial<DisplayDocument>
    if (
      typeof document.id !== 'string' ||
      typeof document.title !== 'string' ||
      typeof document.type !== 'string' ||
      typeof document.file?.name !== 'string' ||
      typeof document.file?.path !== 'string'
    ) {
      return null
    }

    return {
      id: document.id,
      title: document.title,
      description: document.description,
      category: document.category,
      type: document.type,
      file: {
        name: document.file.name,
        path: document.file.path,
        size: document.file.size,
      },
      targetTime: document.targetTime,
      updatedAt: document.updatedAt,
    }
  } catch {
    return null
  }
}

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

function getDisplayMode(document: DisplayDocument) {
  const extension = getFileExtension(document.file.name)

  if (document.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
    return 'image'
  }

  if (document.type.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(extension)) {
    return 'video'
  }

  return 'frame'
}

function getTypeLabel(document: DisplayDocument) {
  const extension = getFileExtension(document.file.name)
  if (extension) return extension.toUpperCase()

  const subtype = document.type.split('/').at(-1)
  return subtype ? subtype.toUpperCase() : 'FILE'
}

function formatDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')
  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)

  return `${formattedDate}, ${pad(date.getHours())}.${pad(date.getMinutes())}`
}

function formatDisplayTime(updatedAt?: number) {
  if (!updatedAt) return '-'

  const date = new Date(updatedAt)
  if (Number.isNaN(date.getTime())) return '-'

  return formatDateTime(date)
}

function formatTargetTime(targetTime?: string | null) {
  if (!targetTime) return '-'

  const date = new Date(targetTime)
  if (Number.isNaN(date.getTime())) return '-'

  return formatDateTime(date)
}

export default function DisplayPageClient() {
  const [document, setDocument] = useState<DisplayDocument | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const displayMode = useMemo(
    () => (document ? getDisplayMode(document) : 'frame'),
    [document]
  )
  const sideRailClassName = 'top-[72px] h-[calc(100%-72px)] py-6'
  const leftSideRailBackgroundClassName = displayMode === 'frame'
    ? 'bg-transparent'
    : 'bg-gradient-to-r from-black via-black/85 to-transparent'
  const rightSideRailBackgroundClassName = displayMode === 'frame'
    ? 'bg-transparent'
    : 'bg-gradient-to-l from-black via-black/85 to-transparent'

  useEffect(() => {
    const originalBodyOverflow = window.document.body.style.overflow
    const originalHtmlOverflow = window.document.documentElement.style.overflow

    window.document.body.style.overflow = 'hidden'
    window.document.documentElement.style.overflow = 'hidden'

    return () => {
      window.document.body.style.overflow = originalBodyOverflow
      window.document.documentElement.style.overflow = originalHtmlOverflow
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    async function loadServerDisplayDocument() {
      try {
        const response = await fetch('/api/display-document', {
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = await response.json()
        const nextDocument = data.document as DisplayDocument | null

        setDocument((currentDocument) => {
          if (!nextDocument) {
            window.localStorage.removeItem(DISPLAY_DOCUMENT_STORAGE_KEY)
            return null
          }

          if (currentDocument?.updatedAt === nextDocument.updatedAt) {
            return currentDocument
          }

          window.localStorage.setItem(
            DISPLAY_DOCUMENT_STORAGE_KEY,
            JSON.stringify(nextDocument)
          )

          return nextDocument
        })
      } catch (error) {
        console.error('Display polling error:', error)
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DISPLAY_DOCUMENT_STORAGE_KEY) {
        setDocument(readDisplayDocument())
      }
    }

    const handleLocalChange = () => {
      setDocument(readDisplayDocument())
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('futaba-display-document-change', handleLocalChange)

    loadServerDisplayDocument()
    const intervalId = window.setInterval(loadServerDisplayDocument, 1000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('futaba-display-document-change', handleLocalChange)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadFileUrl() {
      if (!document) {
        setFileUrl('')
        setError('')
        return
      }

      try {
        setIsLoading(true)
        setError('')

        const response = await fetch('/api/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filePath: document.file.path,
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null)
          throw new Error(data?.error ?? `Gagal memuat file display (${response.status})`)
        }

        const data = await response.json()
        if (typeof data.url !== 'string') {
          throw new Error('URL file display tidak valid')
        }

        if (isMounted) {
          setFileUrl(data.url)
        }
      } catch (error) {
        console.error('Display file load error:', error)
        if (isMounted) {
          setFileUrl('')
          setError(error instanceof Error ? error.message : 'Gagal memuat file display')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadFileUrl()

    return () => {
      isMounted = false
    }
  }, [document])

  return (
    <main className="fixed inset-0 h-screen w-screen overflow-hidden bg-black text-white">
      <section className="h-full w-full overflow-hidden">
        {document && fileUrl && !isLoading && !error && displayMode === 'image' && (
          <img
            src={fileUrl}
            alt={document.title}
            className="h-screen w-screen object-contain"
          />
        )}

        {document && fileUrl && !isLoading && !error && displayMode === 'video' && (
          <video
            src={fileUrl}
            className="h-screen w-screen object-contain"
            controls
            autoPlay
          />
        )}

        {document && fileUrl && !isLoading && !error && displayMode === 'frame' && (
          <iframe
            src={fileUrl}
            title={document.title}
            className="block h-screen w-screen border-0 bg-white"
          />
        )}
      </section>

      <aside className={`pointer-events-none absolute left-0 z-10 flex w-[clamp(120px,24vw,210px)] flex-col justify-between px-4 lg:w-[clamp(120px,10vw,210px)] ${sideRailClassName} ${leftSideRailBackgroundClassName}`}>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Dokumen
            </p>
            <h1 className="mt-2 line-clamp-4 text-sm font-semibold leading-snug text-white">
              {document?.title ?? 'Belum ada file'}
            </h1>
          </div>

          {document && (
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                <FileText className="h-3.5 w-3.5 text-[#67e8f9]" />
                {getTypeLabel(document)}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Target Waktu
                </p>
                <p className="mt-2 text-sm font-semibold capitalize leading-snug text-[#34d399]">
                  {formatTargetTime(document.targetTime)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 text-[11px] text-white/55">
          <div className="h-px w-12 bg-white/25" />
          <p>Futaba Display</p>
          <p className="leading-relaxed">
            Konten akan mengikuti file terakhir yang dipilih dari operator.
          </p>
        </div>
      </aside>

      <aside className={`pointer-events-none absolute right-0 z-10 hidden w-[clamp(120px,10vw,210px)] flex-col items-end justify-between px-4 text-right lg:flex ${sideRailClassName} ${rightSideRailBackgroundClassName}`}>
        <div className="space-y-4">
          <div className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#059669]/40 bg-[#059669]/15">
            <Monitor className="h-5 w-5 text-[#34d399]" />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Status
            </p>
            <p className="mt-2 text-sm font-semibold text-[#34d399]">
              Live Display
            </p>
          </div>
        </div>

        <div className="space-y-3 text-[11px] text-white/55">
          <div className="ml-auto h-px w-12 bg-white/25" />
          <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white/75">
            <Clock className="h-3.5 w-3.5" />
            <span className="capitalize leading-snug">
              {formatDisplayTime(currentTime)}
            </span>
          </div>
          <p className="leading-relaxed">
            Tekan Tampilkan pada halaman operator untuk mengganti layar ini.
          </p>
        </div>
      </aside>
    </main>
  )
}
