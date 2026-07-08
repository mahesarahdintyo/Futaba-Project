"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createProductionReport,
  deleteProductionReport,
  getProductionReports,
  type ProductionReport,
} from "@/lib/services/production-report";

interface ProductionReportFormProps {
  landId: string;
}

export default function ProductionReportForm({ landId }: ProductionReportFormProps) {
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form State
  const [reportDate, setReportDate] = useState(getTodayDateString());
  const [operatorName, setOperatorName] = useState("");
  
  // New Fields requested:
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [partNumber, setPartNumber] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [ngQty, setNgQty] = useState<number>(0);
  const [ngCategory, setNgCategory] = useState("");
  const [breakMinutes, setBreakMinutes] = useState<number>(0);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [reports, setReports] = useState<ProductionReport[]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load production reports for this line
  const loadReports = async () => {
    if (!landId) return;
    try {
      setIsLoadingReports(true);
      const data = await getProductionReports(landId);
      setReports(data);
    } catch (err) {
      console.error("Gagal memuat laporan:", err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [landId]);

  // Adjust NG category based on NG Qty
  useEffect(() => {
    if (ngQty === 0) {
      setNgCategory("");
    } else if (!ngCategory) {
      setNgCategory("Goresan (Scratch)");
    }
  }, [ngQty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!operatorName.trim()) {
      setError("Nama operator tidak boleh kosong");
      return;
    }
    if (!startTime) {
      setError("Waktu awal tidak boleh kosong");
      return;
    }
    if (!endTime) {
      setError("Waktu akhir tidak boleh kosong");
      return;
    }
    if (!partNumber.trim()) {
      setError("Part number tidak boleh kosong");
      return;
    }
    if (qty < 0) {
      setError("Qty tidak boleh negatif");
      return;
    }
    if (ngQty < 0) {
      setError("NG tidak boleh negatif");
      return;
    }
    if (ngQty > qty) {
      setError("Jumlah NG tidak boleh melebihi total Qty");
      return;
    }
    if (breakMinutes < 0) {
      setError("Waktu break tidak boleh negatif");
      return;
    }

    try {
      setIsSubmitting(true);
      await createProductionReport({
        land_id: landId,
        report_date: reportDate,
        shift: "Shift 1",
        operator_name: operatorName,
        start_time: startTime + ":00", // Send in TIME format HH:MM:SS
        end_time: endTime + ":00",
        part_number: partNumber.trim(),
        qty: qty,
        ng_qty: ngQty,
        ng_category: ngQty > 0 ? ngCategory : null,
        break_minutes: breakMinutes,
      });

      setSuccessMsg("Laporan produksi berhasil disimpan!");
      // Reset production specific fields, keep operator info
      setPartNumber("");
      setQty(0);
      setNgQty(0);
      setNgCategory("");
      setBreakMinutes(0);

      // Reload list
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan laporan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, operator: string, part: string) => {
    if (!window.confirm(`Hapus laporan dari ${operator} (Part: ${part})?`)) {
      return;
    }

    try {
      await deleteProductionReport(id);
      setSuccessMsg("Laporan berhasil dihapus.");
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus laporan");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    // timeStr could be HH:MM:SS, let's format to HH:MM
    return timeStr.slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
          <Activity className="h-6 w-6 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-800">Form Laporan Produksi</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tanggal */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Calendar className="h-4 w-4 text-slate-400" />
                Tanggal Produksi
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            {/* Nama Operator */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                Nama Operator
              </label>
              <input
                type="text"
                placeholder="Masukkan nama operator"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            {/* Waktu Awal */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                Waktu Awal
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            {/* Waktu Akhir */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                Waktu Akhir
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                required
              />
            </div>

            {/* Part Number */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" />
                Part Number
              </label>
              <input
                type="text"
                placeholder="Contoh: FT-98765-ABC"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 font-mono"
                required
              />
            </div>

            {/* Qty */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Activity className="h-4 w-4 text-slate-400" />
                Qty (Hasil Produksi)
              </label>
              <input
                type="number"
                min="0"
                value={qty || ""}
                onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="0"
                required
              />
            </div>

            {/* NG */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                NG (Jumlah Cacat)
              </label>
              <input
                type="number"
                min="0"
                value={ngQty || ""}
                onChange={(e) => setNgQty(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="0"
                required
              />
            </div>

            {/* Kategori NG */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Kategori NG
              </label>
              <select
                value={ngCategory}
                onChange={(e) => setNgCategory(e.target.value)}
                disabled={ngQty === 0}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200"
              >
                {ngQty === 0 ? (
                  <option value="">Tidak ada NG</option>
                ) : (
                  <>
                    <option value="Goresan (Scratch)">Goresan (Scratch)</option>
                    <option value="Penyok (Dent)">Penyok (Dent)</option>
                    <option value="Retak (Crack)">Retak (Crack)</option>
                    <option value="Cacat Las (Welding)">Cacat Las (Welding)</option>
                    <option value="Deformasi (Deformed)">Deformasi (Deformed)</option>
                    <option value="Lainnya">Lainnya</option>
                  </>
                )}
              </select>
            </div>

            {/* Break */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-amber-500" />
                Break (Menit)
              </label>
              <input
                type="number"
                min="0"
                value={breakMinutes || ""}
                onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-lg transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Laporan"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Reports History Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-800">
              Riwayat Laporan Hari Ini & Terakhir
            </h3>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
            {reports.length} Laporan
          </span>
        </div>

        {isLoadingReports ? (
          <div className="flex justify-center py-10 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="py-10 text-center text-slate-500">
            Belum ada laporan produksi yang diinput untuk line ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Waktu Kerja</th>
                  <th className="p-3 font-mono">Part Number</th>
                  <th className="p-3 text-center">Qty OK / NG</th>
                  <th className="p-3 text-center">Break</th>
                  <th className="p-3">Kategori NG</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((rpt) => (
                  <tr key={rpt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {formatDate(rpt.report_date)}
                      </div>
                    </td>
                    <td className="p-3 font-medium text-slate-800 whitespace-nowrap">
                      {rpt.operator_name}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {formatTime(rpt.start_time)} - {formatTime(rpt.end_time)}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-800">
                      {rpt.part_number}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-slate-800">{rpt.qty} Total</span>
                      <div className="text-xs font-semibold whitespace-nowrap mt-0.5">
                        <span className="text-emerald-600">{rpt.qty - rpt.ng_qty} OK</span>
                        {" / "}
                        <span className={rpt.ng_qty > 0 ? "text-red-500 font-bold" : "text-slate-400"}>
                          {rpt.ng_qty} NG
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {rpt.break_minutes ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                          {rpt.break_minutes} m
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">
                      {rpt.ng_qty > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {rpt.ng_category || "Lainnya"}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleDelete(rpt.id, rpt.operator_name, rpt.part_number)
                        }
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
