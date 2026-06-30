import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold text-green-600">
        FUTABA
      </h1>

      <p className="text-gray-500">
        Digital Document Display System
      </p>

      <div className="flex gap-4">
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
          Display
        </Link>
      </div>
    </main>
  );
}