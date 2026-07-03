import type { Land } from "@/lib/services/land";

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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="mb-2 block font-semibold text-slate-800">
        Line
      </label>

      <div className="flex flex-wrap gap-2">
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
                className={`rounded-lg border px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-100 ${
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
