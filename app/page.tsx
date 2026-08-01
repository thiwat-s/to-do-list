import { connection } from "next/server";

import { getConnectionStatus } from "@/lib/mongoose";

export default async function Home() {
  await connection();
  const status = await getConnectionStatus();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_#fff7ed_38%,_#ffffff_72%)] px-6 py-20 text-stone-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            MongoDB Setup
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Your Next.js app is wired to MongoDB Atlas.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-600">
            The connection string is stored in a server-only environment
            variable, and this page checks the database connection during the
            request.
          </p>
        </div>

        <section className="rounded-3xl border border-stone-200 bg-white/80 p-8 shadow-[0_20px_80px_rgba(120,53,15,0.12)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-500">
                Connection Status
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-900">
                {status.ok ? "Connected" : "Needs Attention"}
              </h2>
            </div>
            <span
              className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-medium ${
                status.ok
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {status.ok ? "Ping succeeded" : "Ping failed"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-stone-50 p-5">
              <p className="text-sm font-medium text-stone-500">Cluster host</p>
              <p className="mt-2 break-all text-base text-stone-900">
                {status.host ?? "Unavailable"}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50 p-5">
              <p className="text-sm font-medium text-stone-500">Message</p>
              <p className="mt-2 text-base text-stone-900">{status.message}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
