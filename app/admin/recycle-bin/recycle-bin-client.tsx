'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Folder,
  FileText,
  Layers,
  Search,
  AlertTriangle,
  Loader2,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { getLands, type Land } from '@/lib/services/land'
import { getFolders, type Folder as FolderType } from '@/lib/services/folder'
import { getDocuments, type Document as DocumentType } from '@/lib/services/document'
import { getProductionReports, type ProductionReport } from '@/lib/services/production-report'

type TrashTab = 'lands' | 'folders' | 'documents' | 'productionReports'
type RestoreType = 'land' | 'folder' | 'document' | 'production_report'

export default function RecycleBinClient() {
  const [activeTab, setActiveTab] = useState<TrashTab>('lands')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false)

  const [lands, setLands] = useState<Land[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [productionReports, setProductionReports] = useState<ProductionReport[]>([])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [landsData, foldersData, documentsData, productionReportsData] = await Promise.all([
        getLands({ trash: true, includeHidden: true }),
        getFolders({ trash: true, includeAll: true }),
        getDocuments({ trash: true, includeHidden: true }),
        getProductionReports({ trash: true }),
      ])

      setLands(landsData)
      setFolders(foldersData)
      setDocuments(documentsData)
      setProductionReports(productionReportsData)
    } catch (error) {
      console.error('Gagal mengambil data tempat sampah:', error)
      toast.error('Gagal memuat data dari tempat sampah')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleRestore = async (type: RestoreType, id: string | number) => {
    try {
      setIsActionLoading(true)
      const response = await fetch('/api/admin/recycle-bin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Gagal memulihkan item')
      }

      toast.success(result.message ?? 'Item berhasil dipulihkan!')
      await loadData()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat memulihkan')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleEmptyTrash = async () => {
    try {
      setIsActionLoading(true)
      setShowEmptyConfirm(false)
      const response = await fetch('/api/admin/recycle-bin', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? 'Gagal mengosongkan tempat sampah')
      }

      const deleted = result.deleted
      const deletedCount = deleted
        ? (deleted.lands ?? 0) +
          (deleted.folders ?? 0) +
          (deleted.documents ?? 0) +
          (deleted.productionReports ?? 0)
        : null

      toast.success(
        deletedCount === null
          ? 'Tempat sampah berhasil dikosongkan secara permanen!'
          : `Tempat sampah berhasil dikosongkan (${deletedCount} item dihapus permanen).`
      )
      await loadData()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengosongkan tempat sampah')
    } finally {
      setIsActionLoading(false)
    }
  }

  const filteredLands = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return lands.filter((land) =>
      land.name.toLowerCase().includes(query) ||
      (land.description || '').toLowerCase().includes(query)
    )
  }, [searchQuery, lands])

  const filteredFolders = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return folders.filter((folder) => folder.name.toLowerCase().includes(query))
  }, [searchQuery, folders])

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return documents.filter((doc) =>
      doc.title.toLowerCase().includes(query) ||
      (doc.description || '').toLowerCase().includes(query) ||
      doc.file.name.toLowerCase().includes(query)
    )
  }, [searchQuery, documents])

  const filteredProductionReports = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return productionReports.filter((report) =>
      report.operator_name.toLowerCase().includes(query) ||
      report.part_number.toLowerCase().includes(query) ||
      report.shift.toLowerCase().includes(query) ||
      (report.land?.name || '').toLowerCase().includes(query)
    )
  }, [searchQuery, productionReports])

  const formatBytes = (bytes?: number, decimals = 2) => {
    if (!bytes) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + (sizes[i] ?? 'B')
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const [year, month, day] = dateStr.split('-')
    if (year && month && day) return `${day}/${month}/${year}`
    return dateStr
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-'
    const parts = timeStr.split(':')
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr
  }

  const tabs: Array<{ id: TrashTab; label: string; count: number; icon: typeof Layers }> = [
    { id: 'lands', label: 'Cards', count: lands.length, icon: Layers },
    { id: 'folders', label: 'Folders', count: folders.length, icon: Folder },
    { id: 'documents', label: 'Dokumen', count: documents.length, icon: FileText },
    { id: 'productionReports', label: 'Laporan', count: productionReports.length, icon: ClipboardList },
  ]

  const totalItemsCount = lands.length + folders.length + documents.length + productionReports.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-zinc-100 text-slate-900 font-sans pb-16">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 select-none">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                Tempat Sampah (Recycle Bin)
              </h1>
            </div>
          </div>

          <Button
            variant="destructive"
            size="sm"
            disabled={totalItemsCount === 0 || isLoading || isActionLoading}
            onClick={() => setShowEmptyConfirm(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 shadow-sm shadow-red-100 border border-transparent active:scale-95"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Kosongkan Tempat Sampah
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {totalItemsCount > 0 && (
          <div className="mb-8 p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex gap-3 shadow-sm select-none">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">Peringatan Penting</h4>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Item yang berada di tempat sampah ini dapat dipulihkan kapan saja. Namun, jika Anda mengeklik tombol{' '}
                <strong>&quot;Kosongkan Tempat Sampah&quot;</strong>, semua data, laporan produksi, referensi display TV,
                dan file dokumen fisik di Supabase Storage akan dihapus secara <strong>permanen dan tidak dapat dibatalkan</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Card Terhapus" count={lands.length} icon={Layers} iconClassName="bg-blue-50 text-blue-600 border-blue-100" />
          <StatCard label="Folder Terhapus" count={folders.length} icon={Folder} iconClassName="bg-emerald-50 text-emerald-600 border-emerald-100" />
          <StatCard label="Dokumen Terhapus" count={documents.length} icon={FileText} iconClassName="bg-purple-50 text-purple-600 border-purple-100" />
          <StatCard label="Laporan Terhapus" count={productionReports.length} icon={ClipboardList} iconClassName="bg-amber-50 text-amber-600 border-amber-100" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 p-4 gap-4 bg-slate-50/50">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start overflow-x-auto max-w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition duration-200 cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200/40'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label} ({tab.count})
                  </button>
                )
              })}
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari item terhapus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 bg-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
              />
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-slate-500 text-sm mt-3 font-medium">Memuat data sampah...</p>
              </div>
            ) : (
              <>
                {activeTab === 'lands' && (
                  <>
                    {filteredLands.length === 0 ? (
                      <EmptyState icon={Layers} message={searchQuery ? 'Pencarian tidak ditemukan' : 'Tidak ada card di tempat sampah'} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredLands.map((land) => (
                          <div
                            key={land.id}
                            className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-slate-300 transition duration-200 group"
                          >
                            <div className="min-w-0 pr-4">
                              <h4 className="font-bold text-slate-800 truncate">{land.name}</h4>
                              <p className="text-xs text-slate-400 truncate mt-1">{land.description || 'Tidak ada deskripsi'}</p>
                            </div>
                            <RestoreButton disabled={isActionLoading} onClick={() => handleRestore('land', land.id)} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'folders' && (
                  <>
                    {filteredFolders.length === 0 ? (
                      <EmptyState icon={Folder} message={searchQuery ? 'Pencarian tidak ditemukan' : 'Tidak ada folder di tempat sampah'} />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase">
                              <th className="py-3 px-2">Nama Folder</th>
                              <th className="py-3 px-2">ID Folder</th>
                              <th className="py-3 px-2 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFolders.map((folder) => (
                              <tr key={folder.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                                <td className="py-3 px-2 font-semibold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>{folder.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-xs text-slate-400">#{folder.id}</td>
                                <td className="py-3 px-2 text-right">
                                  <RestoreButton disabled={isActionLoading} onClick={() => handleRestore('folder', folder.id)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'documents' && (
                  <>
                    {filteredDocuments.length === 0 ? (
                      <EmptyState icon={FileText} message={searchQuery ? 'Pencarian tidak ditemukan' : 'Tidak ada dokumen di tempat sampah'} />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase">
                              <th className="py-3 px-2">Judul Dokumen</th>
                              <th className="py-3 px-2">Nama File</th>
                              <th className="py-3 px-2">Tipe / Ukuran</th>
                              <th className="py-3 px-2 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDocuments.map((doc) => (
                              <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                                <td className="py-3 px-2 font-semibold text-slate-800">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                                    <span>{doc.title}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-xs text-slate-500 max-w-[200px] truncate">{doc.file.name}</td>
                                <td className="py-3 px-2 text-xs text-slate-400">{doc.type.toUpperCase()} / {formatBytes(doc.file.size)}</td>
                                <td className="py-3 px-2 text-right">
                                  <RestoreButton disabled={isActionLoading} onClick={() => handleRestore('document', doc.id)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'productionReports' && (
                  <>
                    {filteredProductionReports.length === 0 ? (
                      <EmptyState icon={ClipboardList} message={searchQuery ? 'Pencarian tidak ditemukan' : 'Tidak ada laporan produksi di tempat sampah'} />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-400 uppercase">
                              <th className="py-3 px-2">Tanggal</th>
                              <th className="py-3 px-2">Line</th>
                              <th className="py-3 px-2">Operator</th>
                              <th className="py-3 px-2">Shift</th>
                              <th className="py-3 px-2">Part Number</th>
                              <th className="py-3 px-2">QTY</th>
                              <th className="py-3 px-2 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProductionReports.map((report) => (
                              <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm">
                                <td className="py-3 px-2 font-semibold text-slate-800">{formatDate(report.report_date)}</td>
                                <td className="py-3 px-2 text-slate-600">{report.land?.name ?? '-'}</td>
                                <td className="py-3 px-2 text-slate-600">{report.operator_name}</td>
                                <td className="py-3 px-2 text-slate-500">{report.shift}</td>
                                <td className="py-3 px-2 text-slate-500">{report.part_number}</td>
                                <td className="py-3 px-2 text-xs text-slate-400">
                                  {report.qty} total / {report.ng_qty} NG / {formatTime(report.start_time)}-{formatTime(report.end_time)}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  <RestoreButton disabled={isActionLoading} onClick={() => handleRestore('production_report', report.id)} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {showEmptyConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full select-none animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Kosongkan Tempat Sampah?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Tindakan ini akan menghapus seluruh data secara <strong>permanen</strong> dari database dan menghapus semua file fisik dari Supabase Storage. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmptyConfirm(false)}
                className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-semibold"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm shadow-red-100"
              >
                Ya, Hapus Permanen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  count,
  icon: Icon,
  iconClassName,
}: {
  label: string
  count: number
  icon: typeof Layers
  iconClassName: string
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md">
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{count}</h3>
      </div>
      <div className={`p-3 rounded-2xl border ${iconClassName}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof Layers; message: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-400 text-base font-medium">{message}</p>
    </div>
  )
}

function RestoreButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="xs"
      disabled={disabled}
      onClick={onClick}
      className="border-blue-200 bg-white text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 active:scale-95 transition-all text-xs font-semibold shadow-sm"
    >
      <RotateCcw className="w-3 h-3 mr-1" />
      Pulihkan
    </Button>
  )
}
