import { AppHeader } from "@/components/app-header";

interface OperatorHeaderProps {
  selectedLand: string;
}

export default function OperatorHeader({ selectedLand }: OperatorHeaderProps) {
  return (
    <AppHeader
      logoAside={
        <div className="flex flex-col border-slate-200 sm:border-l sm:pl-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Land Operator
          </span>
          <span className="text-base font-bold text-emerald-700">
            {selectedLand}
          </span>
        </div>
      }
    />
  );
}
