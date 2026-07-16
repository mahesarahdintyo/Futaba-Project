import type { Land } from "@/lib/services/land";
import { MonitorUp } from "lucide-react";

interface LandSelectorProps {
  value: Land | null;
  lands: Land[];
  onChange: (value: Land) => void;
}

export default function LandSelector({
  value,
  lands,
  onChange,
}: LandSelectorProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <label className="block font-semibold text-slate-800">
          Line
        </label>

        {value && (
          <a
            href={`/display/${encodeURIComponent(value.id)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            <MonitorUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Display
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {lands.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
            Belum ada line tersedia
          </p>
        ) : (
          lands.map((land) => {
            const isSelected = value?.id === land.id;

            return (
              <button
                key={land.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(land)}
                className={`rounded-lg border px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-100 ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border-slate-300 bg-white text-slate-800 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {land.name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
