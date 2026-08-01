"use client";

import { useEffect, useState } from "react";

import TodoList from "@/components/TodoList";
import type { BoardData } from "@/components/types";

type ApiPayload<T> = {
  data?: T;
  error?: string;
};

const EMPTY_BOARD: BoardData = {
  columns: [],
  todos: [],
};

export default function TodoPage() {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadBoard() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/board?ts=${Date.now()}`, {
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as ApiPayload<BoardData>;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load board.");
      }

      setBoard(payload.data ?? EMPTY_BOARD);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load board."
      );
      setBoard(EMPTY_BOARD);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBoard();
  }, []);

  if (loading && !board) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] text-slate-900">
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-6 py-6 lg:px-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  GitHub-Style Board
                </p>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                    Project board for your tasks
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Create columns, manage cards inside each column, and drag work
                    between stages like a lightweight GitHub Projects board.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Columns
                  </p>
                  <p className="mt-2 text-2xl font-semibold">...</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Cards
                  </p>
                  <p className="mt-2 text-2xl font-semibold">...</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Done
                  </p>
                  <p className="mt-2 text-2xl font-semibold">...</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    State
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    Loading...
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-400 outline-none"
                  placeholder="Add a column, for example Backlog"
                  disabled
                />
                <button
                  type="button"
                  disabled
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white opacity-60"
                >
                  New column
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Loading board
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Fetching your board from the API...
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This page now loads on the client first, so you should see a real
              network request to <code>/api/board</code> in DevTools.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && board?.columns.length === 0) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] px-6 py-16 text-slate-900 lg:px-10">
        <div className="mx-auto max-w-5xl rounded-3xl border border-rose-200 bg-white px-8 py-16 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
            Board error
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            We could not load your board.
          </h1>
          <p className="mt-3 text-sm leading-6 text-rose-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadBoard()}
            className="mt-6 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
          >
            Retry loading
          </button>
        </div>
      </div>
    );
  }

  return <TodoList initialBoard={board ?? EMPTY_BOARD} />;
}
