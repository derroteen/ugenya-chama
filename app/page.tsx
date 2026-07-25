import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Ugenya Chama
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          A simple portal for members to access their account.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Login
        </Link>
      </section>
    </main>
  );
}
