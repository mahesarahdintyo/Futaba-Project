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
        Land
      </label>

      <select
        value={value?.id ?? ""}
        onChange={(event) => {
          const land = lands.find((item) => item.id === event.target.value);

          if (land) {
            onChange(land);
          }
        }}
        className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {lands.map((land) => (
          <option key={land.id} value={land.id}>
            {land.name}
          </option>
        ))}
      </select>
    </div>
  );
}
