"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Tag,
  TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createProductionReport } from "@/lib/services/production-report";
import { getPartNumbers } from "@/lib/services/part-number";
import { getNgCategories, type NgCategory } from "@/lib/services/ng-category";

interface ProductionReportFormProps {
  landId: string;
}

interface DateTimeFieldProps {
  id: string;
  label: string;
  date: string;
  time: string;
  isEditing: boolean;
  disabled?: boolean;
  placeholder?: string;
  onEdit: () => void;
  onChange: (value: string) => void;
}

interface NumericStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
  hasError?: boolean;
}

interface ChoiceRowProps {
  label: string;
  value: "1" | "2";
  onChange: (value: "1" | "2") => void;
}



function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function getDateString(date: Date) {
  const year = date.getFullYear();
  const month = padTime(date.getMonth() + 1);
  const day = padTime(date.getDate());
  return `${year}-${month}-${day}`;
}

function getTimeString(date: Date) {
  const hours = padTime(date.getHours());
  const minutes = padTime(date.getMinutes());
  const seconds = padTime(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
}

function normalizeTime(time: string) {
  const [hours = "00", minutes = "00", seconds = "00"] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
}

function formatDateTimeDisplay(dateString: string, timeString: string) {
  if (!dateString || !timeString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const [hours, minutes, seconds] = normalizeTime(timeString).split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${padTime(month)}/${padTime(day)}/${year} ${padTime(displayHours)}:${padTime(minutes)}:${padTime(seconds)} ${period}`;
}

function getDateTimeInputValue(dateString: string, timeString: string) {
  if (!dateString || !timeString) return "";
  return `${dateString}T${normalizeTime(timeString)}`;
}

function parseDateTimeInput(value: string) {
  const [dateString, rawTime = ""] = value.split("T");
  return {
    date: dateString,
    time: normalizeTime(rawTime),
  };
}

function DateTimeField({
  id,
  label,
  date,
  time,
  isEditing,
  disabled = false,
  placeholder = "--/--/---- --:--:-- --",
  onEdit,
  onChange,
}: DateTimeFieldProps) {
  const displayValue = formatDateTimeDisplay(date, time);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {label}
        </label>
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled}
          className="inline-flex h-7 items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      <div className="relative">
        {isEditing ? (
          <input
            id={id}
            type="datetime-local"
            step="1"
            value={getDateTimeInputValue(date, time)}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className="h-12 w-full rounded border border-slate-300 bg-white px-4 pr-11 text-base text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400"
          />
        ) : (
          <input
            id={id}
            type="text"
            value={displayValue}
            placeholder={placeholder}
            readOnly
            className="h-12 w-full rounded border border-slate-300 bg-white px-4 pr-11 text-base font-medium text-slate-950 outline-none placeholder:text-slate-400"
          />
        )}
        <CalendarDays className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      </div>
    </div>
  );
}

function NumericStepper({ label, value, onChange, required = false, hasError = false }: NumericStepperProps) {
  // displayValue: empty string when focused and value is 0 so typing replaces 0
  const [isFocused, setIsFocused] = useState(false);
  const displayValue = isFocused && value === 0 ? "" : value;

  const updateValue = (nextValue: number) => {
    onChange(Math.max(0, nextValue));
  };

  const handleIncrement = () => {
    // When value is 0, pressing + should go to 1 (replaces 0)
    updateValue(value + 1);
  };

  const handleDecrement = () => {
    updateValue(value - 1);
  };

  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4">
      <label className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="space-y-1">
        <div
          className={`flex h-14 items-center rounded border bg-white focus-within:ring-3 ${
            hasError
              ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-100"
              : "border-slate-300 focus-within:border-emerald-500 focus-within:ring-emerald-100"
          }`}
        >
          <input
            type="number"
            min="0"
            value={displayValue}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              // Ensure empty input resets to 0
              if (e.target.value === "") updateValue(0);
            }}
            onChange={(event) => {
              const raw = event.target.value;
              if (raw === "") {
                // Keep internal value as 0 while field looks empty during editing
                onChange(0);
                return;
              }
              updateValue(Number(raw));
            }}
            className="h-full min-w-0 flex-1 rounded-l border-0 bg-transparent px-4 text-lg font-medium text-slate-950 outline-none"
          />
          <div className="flex h-full items-center gap-1 px-3 text-slate-600">
            <button
              type="button"
              onClick={handleDecrement}
              className="inline-flex h-9 w-9 items-center justify-center rounded transition hover:bg-slate-100 hover:text-slate-950"
              aria-label={`Kurangi ${label}`}
            >
              <Minus className="h-5 w-5 stroke-[3]" />
            </button>
            <button
              type="button"
              onClick={handleIncrement}
              className="inline-flex h-9 w-9 items-center justify-center rounded transition hover:bg-slate-100 hover:text-slate-950"
              aria-label={`Tambah ${label}`}
            >
              <Plus className="h-5 w-5 stroke-[3]" />
            </button>
          </div>
        </div>
        {hasError && (
          <p className="flex items-center gap-1 text-xs font-medium text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {label} tidak boleh 0
          </p>
        )}
      </div>
    </div>
  );
}

function ChoiceRow({ label, value, onChange }: ChoiceRowProps) {
  return (
    <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-4">
      <label className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {(["1", "2"] as const).map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`h-14 rounded border text-lg font-medium transition ${isSelected
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ProductionReportForm({ landId }: ProductionReportFormProps) {
  const [partNumber, setPartNumber] = useState("");
  const [partNumbers, setPartNumbers] = useState<string[]>([]);
  const [reportDate, setReportDate] = useState(getDateString(new Date()));

  // NG Categories
  const [ngCategories, setNgCategories] = useState<NgCategory[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [pnData, ngCatData] = await Promise.all([
          getPartNumbers(),
          getNgCategories(),
        ]);
        setPartNumbers(pnData.map((pn) => pn.code));
        setNgCategories(ngCatData);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        // Fallback jika API gagal
        setPartNumbers(["FTB-001-A", "FTB-002-B", "FTB-003-C"]);
      }
    }
    loadData();
  }, []);
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [qty, setQty] = useState(0);
  const [ngQty, setNgQty] = useState(0);
  const [ngCategory, setNgCategory] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [pc1, setPc1] = useState<"1" | "2">("1");
  const [pc2, setPc2] = useState<"1" | "2">("1");
  const [editingField, setEditingField] = useState<"start" | "end" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetProductionDetails = () => {
    setQty(0);
    setNgQty(0);
    setNgCategory("");
    setBreakMinutes(0);
    setPc1("1");
    setPc2("1");
  };

  const resetTimes = () => {
    setStartDate("");
    setStartTime("");
    setEndDate("");
    setEndTime("");
    setEditingField(null);
  };

  const handlePartNumberChange = (value: string) => {
    setPartNumber(value);
    resetProductionDetails();

    if (!value) {
      resetTimes();
      return;
    }

    const now = new Date();
    const date = getDateString(now);
    setReportDate(date);
    setStartDate(date);
    setStartTime(getTimeString(now));
    setEndDate("");
    setEndTime("");
    setEditingField(null);
  };

  const handleStartDateTimeChange = (value: string) => {
    const next = parseDateTimeInput(value);
    setStartDate(next.date);
    setStartTime(next.time);
    setReportDate(next.date);
  };

  const handleEndDateTimeChange = (value: string) => {
    const next = parseDateTimeInput(value);
    setEndDate(next.date);
    setEndTime(next.time);
  };

  const handleFinish = () => {
    const now = new Date();
    setEndDate(getDateString(now));
    setEndTime(getTimeString(now));
    setEditingField(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partNumber) {
      toast.error("Part number tidak boleh kosong");
      return;
    }

    if (!startDate || !startTime) {
      toast.error("Waktu awal belum terset");
      return;
    }

    if (!endDate || !endTime) {
      toast.error("Tekan tombol Finish untuk menentukan waktu akhir");
      return;
    }

    if (qty === 0) {
      toast.error("QTY tidak boleh 0. Masukkan jumlah produksi yang sesuai.");
      return;
    }

    if (ngQty > qty) {
      toast.error("Jumlah NG tidak boleh melebihi QTY");
      return;
    }

    if (ngQty > 0 && !ngCategory) {
      toast.error("Pilih kategori NG karena jumlah NG lebih dari 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createProductionReport({
        land_id: landId,
        report_date: reportDate,
        shift: "Shift 1",
        operator_name: "Operator",
        start_time: startTime,
        end_time: endTime,
        part_number: partNumber,
        qty,
        ng_qty: ngQty,
        ng_category: ngQty > 0 ? ngCategory : null,
        break_minutes: breakMinutes,
      });

      toast.success("Laporan produksi berhasil disimpan!");
      setPartNumber("");
      resetTimes();
      resetProductionDetails();
      setReportDate(getDateString(new Date()));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan laporan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-[860px] pt-8">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <h2 className="text-lg font-semibold text-slate-950">Laporan Produksi</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pilih part number, mulai produksi, lalu tekan Finish saat pekerjaan selesai.
          </p>
        </div>

        <div className="space-y-6">

          <div className="space-y-2">
            <label htmlFor="part-number" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Part Number
            </label>
            <div className="relative rounded border border-slate-300 bg-white transition focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-100">
              <select
                id="part-number"
                value={partNumber}
                onChange={(e) => handlePartNumberChange(e.target.value)}
                className="h-12 w-full appearance-none bg-transparent px-4 pr-11 text-base font-medium text-slate-950 outline-none"
                required
              >
                <option value="">Pilih part number</option>
                {partNumbers.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {partNumber && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DateTimeField
                  id="start-time"
                  label="Waktu Awal"
                  date={startDate}
                  time={startTime}
                  isEditing={editingField === "start"}
                  onEdit={() => setEditingField((current) => (current === "start" ? null : "start"))}
                  onChange={handleStartDateTimeChange}
                />

                <DateTimeField
                  id="end-time"
                  label="Waktu Akhir"
                  date={endDate}
                  time={endTime}
                  isEditing={editingField === "end"}
                  disabled={!endTime}
                  onEdit={() => setEditingField((current) => (current === "end" ? null : "end"))}
                  onChange={handleEndDateTimeChange}
                />
              </div>

              {!endTime ? (
                <div className="flex justify-end border-t border-slate-200 pt-5">
                  <Button
                    type="button"
                    onClick={handleFinish}
                    className="h-11 rounded bg-slate-800 px-5 font-semibold text-white transition hover:bg-slate-950"
                  >
                    <TimerReset className="mr-2 h-4 w-4" />
                    Finish
                  </Button>
                </div>
              ) : (
                <div className="space-y-7 border-t border-slate-200 pt-6">
                  <div className="space-y-6">
                    <NumericStepper label="QTY" value={qty} onChange={setQty} required hasError={qty === 0} />
                    <NumericStepper
                      label="NG"
                      value={ngQty}
                      onChange={(val) => {
                        setNgQty(val);
                        // Reset kategori NG jika NG dikembalikan ke 0
                        if (val === 0) setNgCategory("");
                      }}
                    />

                    {/* Kategori NG — muncul hanya saat ngQty > 0 */}
                    {ngQty > 0 && (
                      <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4">
                        <label className="text-sm font-semibold uppercase tracking-wide text-slate-600 pt-1">
                          Kat. NG
                          <span className="ml-1 text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                          {ngCategories.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">
                              Belum ada kategori NG. Hubungi admin.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {ngCategories.map((cat) => {
                                const isSelected = ngCategory === cat.name;
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setNgCategory(cat.name)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                      isSelected
                                        ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-100"
                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                    }`}
                                  >
                                    <Tag className="h-3.5 w-3.5" />
                                    {cat.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          {ngQty > 0 && !ngCategory && (
                            <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Pilih kategori NG
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <NumericStepper label="BREAK" value={breakMinutes} onChange={setBreakMinutes} />
                    <ChoiceRow label="PC-1" value={pc1} onChange={setPc1} />
                    <ChoiceRow label="PC-2" value={pc2} onChange={setPc2} />
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      onClick={handleFinish}
                      className="h-11 rounded border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <TimerReset className="mr-2 h-4 w-4" />
                      Update Finish
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 rounded bg-emerald-600 px-7 font-semibold text-white transition hover:bg-emerald-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Laporan"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
