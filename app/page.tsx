import Link from "next/link";
import Image from "next/image";
import { AppHeader } from "@/components/app-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AppHeader />

      <main className="flex min-h-[calc(100vh-81px)] flex-col items-center justify-center gap-6 px-6">
        <Image
          src="/futaba-logo.png"
          alt="FUTABA Logo"
          width={220}
          height={76}
          className="h-auto w-56 object-contain"
          priority
        />

        <p className="text-gray-500">
          Digital Document Display System
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/admin"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Admin
          </Link>

          <Link
            href="/operator"
            className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition"
          >
            Operator
          </Link>

          <Link
            href="/display"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Status
          </Link>
        </div>
      </main>
    </div>
  );
}
