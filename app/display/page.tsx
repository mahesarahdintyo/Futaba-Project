import { AppHeader } from "@/components/app-header";

export default function DisplayPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />

      <main className="px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900">Display Screen</h1>
      </main>
    </div>
  );
}
