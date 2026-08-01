"use client";

import { useMemo, useState } from "react";

import AppDialog from "@/components/AppDialog";
import TodoForm from "@/components/TodoForm";
import type { BoardData, ColumnItem, TodoItem } from "@/components/types";
import {
  COLUMN_COLOR_OPTIONS,
  type ColumnColor,
} from "@/lib/column-colors";
import {
  COLUMN_TITLE_MAX_LENGTH,
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from "@/lib/validation";

const COLUMN_STYLES = Object.fromEntries(
  COLUMN_COLOR_OPTIONS.map((option) => [
    option.value,
    {
      badge: option.badge,
      ring: option.ring,
      soft: option.soft,
    },
  ])
) as Record<string, { badge: string; ring: string; soft: string }>;

type TodoListProps = {
  initialBoard: BoardData;
};

type ApiPayload<T> = {
  data?: T;
  error?: string;
};

type DeleteColumnResult = {
  deletedId: string;
  movedTo: string;
};

type ColumnDialogState =
  | {
      mode: "edit";
      columnId: string;
      title: string;
      color: ColumnColor;
    }
  | {
      mode: "delete";
      column: ColumnItem;
    }
  | null;

type CardDialogState =
  | {
      mode: "edit";
      todoId: string;
      title: string;
      description: string;
    }
  | {
      mode: "delete";
      todo: TodoItem;
    }
  | null;

function formatRelativeDate(value?: string) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function EmptyBoardState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-8 py-16 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
        No columns yet
      </p>
      <h2 className="mt-4 text-2xl font-semibold text-slate-900">
        Create your first column to get started.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
        If your board should already exist, try reloading from the API.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Retry loading
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
      {children}
    </label>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: ColumnColor;
  onChange: (value: ColumnColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLUMN_COLOR_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            value === option.value
              ? `${option.badge} ${option.ring} ring-2 ring-slate-300`
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function TodoList({ initialBoard }: TodoListProps) {
  const [board, setBoard] = useState(initialBoard);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draggedTodo, setDraggedTodo] = useState<TodoItem | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [newColumnColor, setNewColumnColor] = useState<ColumnColor>("slate");
  const [columnDialog, setColumnDialog] = useState<ColumnDialogState>(null);
  const [cardDialog, setCardDialog] = useState<CardDialogState>(null);

  const groupedTodos = useMemo(() => {
    const groups = new Map<string, TodoItem[]>();

    for (const column of board.columns) {
      groups.set(column._id, []);
    }

    for (const todo of board.todos) {
      const current = groups.get(todo.columnId) ?? [];
      current.push(todo);
      groups.set(todo.columnId, current);
    }

    for (const todos of groups.values()) {
      todos.sort((left, right) => left.order - right.order);
    }

    return groups;
  }, [board.columns, board.todos]);

  const completedCount = board.todos.filter((todo) => todo.completed).length;
  const canCreateColumn = newColumnTitle.trim().length > 0 && !pending;

  async function request<T>(input: string, init?: RequestInit) {
    const response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const payload = (await response.json().catch(() => ({}))) as ApiPayload<T>;

    if (!response.ok) {
      throw new Error(payload.error ?? "Request failed.");
    }

    return payload.data;
  }

  async function refreshBoard() {
    const data = await request<BoardData>("/api/board", {
      cache: "no-store",
    });

    setBoard(data ?? { columns: [], todos: [] });
  }

  async function runMutation(work: () => Promise<void>) {
    try {
      setPending(true);
      setError(null);
      await work();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unknown board error."
      );
    } finally {
      setPending(false);
      setActiveColumnId(null);
      setDraggedTodo(null);
    }
  }

  async function handleRetry() {
    await runMutation(async () => {
      await refreshBoard();
    });
  }

  async function handleCreateColumn() {
    const title = newColumnTitle.trim();

    if (!title || pending) {
      return;
    }

    await runMutation(async () => {
      const created = await request<ColumnItem>("/api/columns", {
        method: "POST",
        body: JSON.stringify({ title, color: newColumnColor }),
      });

      if (!created) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        ...current,
        columns: [...current.columns, created].sort(
          (left, right) => left.order - right.order
        ),
      }));
      setNewColumnTitle("");
      setNewColumnColor("slate");
    });
  }

  function openEditColumnDialog(column: ColumnItem) {
    setColumnDialog({
      mode: "edit",
      columnId: column._id,
      title: column.title,
      color: (column.color as ColumnColor) ?? "slate",
    });
  }

  function openDeleteColumnDialog(column: ColumnItem) {
    setColumnDialog({ mode: "delete", column });
  }

  async function submitColumnEdit() {
    if (!columnDialog || columnDialog.mode !== "edit") {
      return;
    }

    const title = columnDialog.title.trim();

    if (!title) {
      setError("Column title is required.");
      return;
    }

    await runMutation(async () => {
      const updated = await request<ColumnItem>(
        `/api/columns/${columnDialog.columnId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title,
            color: columnDialog.color,
          }),
        }
      );

      if (!updated) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        ...current,
        columns: current.columns.map((item) =>
          item._id === updated._id ? updated : item
        ),
      }));
      setColumnDialog(null);
    });
  }

  async function confirmDeleteColumn() {
    if (!columnDialog || columnDialog.mode !== "delete") {
      return;
    }

    const { column } = columnDialog;

    await runMutation(async () => {
      const result = await request<DeleteColumnResult>(
        `/api/columns/${column._id}`,
        {
          method: "DELETE",
        }
      );

      if (!result) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        columns: current.columns.filter((item) => item._id !== result.deletedId),
        todos: current.todos.map((todo) =>
          todo.columnId === result.deletedId
            ? { ...todo, columnId: result.movedTo }
            : todo
        ),
      }));
      setColumnDialog(null);
    });
  }

  async function handleCreateCard(columnId: string, title: string) {
    await runMutation(async () => {
      const created = await request<TodoItem>("/api/todos", {
        method: "POST",
        body: JSON.stringify({
          title,
          columnId,
        }),
      });

      if (!created) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        ...current,
        todos: [...current.todos, created],
      }));
    });
  }

  function openEditCardDialog(todo: TodoItem) {
    setCardDialog({
      mode: "edit",
      todoId: todo._id,
      title: todo.title,
      description: todo.description,
    });
  }

  function openDeleteCardDialog(todo: TodoItem) {
    setCardDialog({ mode: "delete", todo });
  }

  async function submitCardEdit() {
    if (!cardDialog || cardDialog.mode !== "edit") {
      return;
    }

    const title = cardDialog.title.trim();

    if (!title) {
      setError("Card title is required.");
      return;
    }

    await runMutation(async () => {
      const updated = await request<TodoItem>(`/api/todos/${cardDialog.todoId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description: cardDialog.description,
        }),
      });

      if (!updated) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        ...current,
        todos: current.todos.map((item) =>
          item._id === updated._id ? updated : item
        ),
      }));
      setCardDialog(null);
    });
  }

  async function confirmDeleteCard() {
    if (!cardDialog || cardDialog.mode !== "delete") {
      return;
    }

    const { todo } = cardDialog;

    await runMutation(async () => {
      await request(`/api/todos/${todo._id}`, {
        method: "DELETE",
      });

      setBoard((current) => ({
        ...current,
        todos: current.todos.filter((item) => item._id !== todo._id),
      }));
      setCardDialog(null);
    });
  }

  async function handleToggleCard(todo: TodoItem) {
    await runMutation(async () => {
      const updated = await request<TodoItem>(`/api/todos/${todo._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !todo.completed }),
      });

      if (!updated) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        ...current,
        todos: current.todos.map((item) =>
          item._id === updated._id ? updated : item
        ),
      }));
    });
  }

  async function handleDropOnColumn(columnId: string) {
    if (!draggedTodo || draggedTodo.columnId === columnId) {
      setDraggedTodo(null);
      setActiveColumnId(null);
      return;
    }

    await runMutation(async () => {
      const updated = await request<TodoItem>(`/api/todos/${draggedTodo._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          columnId,
          order: Date.now(),
        }),
      });

      if (!updated) {
        await refreshBoard();
        return;
      }

      setBoard((current) => ({
        ...current,
        todos: current.todos.map((item) =>
          item._id === updated._id ? updated : item
        ),
      }));
    });
  }

  return (
    <>
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
                  <p className="mt-2 text-2xl font-semibold">{board.columns.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Cards
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{board.todos.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Done
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    State
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {pending ? "Syncing board..." : "Ready"}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,460px)_max-content_160px] xl:items-start xl:gap-4">
                <div className="min-w-0 xl:self-stretch">
                  <FieldLabel>New Column Name</FieldLabel>
                  <div className="mt-2">
                    <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                    value={newColumnTitle}
                    maxLength={COLUMN_TITLE_MAX_LENGTH}
                    onChange={(event) => setNewColumnTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleCreateColumn();
                      }
                    }}
                    placeholder="Add a column, for example Backlog"
                    disabled={pending}
                  />
                  </div>
                  <p className="mt-2 text-right text-xs text-slate-400">
                    {newColumnTitle.length}/{COLUMN_TITLE_MAX_LENGTH}
                  </p>
                </div>

                <div className="pt-1">
                  <FieldLabel>Color</FieldLabel>
                  <div className="mt-3">
                    <ColorPicker
                      value={newColumnColor}
                      onChange={setNewColumnColor}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canCreateColumn}
                  onClick={() => void handleCreateColumn()}
                  className="mt-[30px] h-11 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 xl:w-full"
                >
                  New column
                </button>
              </div>
            </div>

            {error ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void handleRetry()}
                  className="rounded-xl border border-rose-300 bg-white px-4 py-2 font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Retry
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10">
          {board.columns.length === 0 ? (
            <EmptyBoardState onRetry={() => void handleRetry()} />
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-6">
              {board.columns.map((column) => {
                const todos = groupedTodos.get(column._id) ?? [];
                const styles = COLUMN_STYLES[column.color] ?? COLUMN_STYLES.slate;

                return (
                  <section
                    key={column._id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setActiveColumnId(column._id);
                    }}
                    onDragLeave={() => {
                      if (activeColumnId === column._id) {
                        setActiveColumnId(null);
                      }
                    }}
                    onDrop={() => void handleDropOnColumn(column._id)}
                    className={`flex min-h-[620px] w-[340px] shrink-0 flex-col rounded-3xl border bg-white shadow-sm transition ${
                      activeColumnId === column._id
                        ? `${styles.ring} ${styles.soft} ring-2 ring-sky-200`
                        : "border-slate-200"
                    }`}
                  >
                    <div className="border-b border-slate-200 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}`}
                            >
                              {column.title}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {todos.length} cards
                            </span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                            Drop cards here
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditColumnDialog(column)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteColumnDialog(column)}
                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <TodoForm
                        label={`Add card to ${column.title}`}
                        placeholder={`Add a card to ${column.title}`}
                        submitText="Add"
                        onSubmit={(title) => handleCreateCard(column._id, title)}
                        disabled={pending}
                        maxLength={TODO_TITLE_MAX_LENGTH}
                        className="mt-4"
                        buttonClassName="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>

                    <div className="flex-1 space-y-3 p-4">
                      {todos.map((todo) => (
                        <article
                          key={todo._id}
                          draggable
                          onDragStart={() => setDraggedTodo(todo)}
                          onDragEnd={() => {
                            setDraggedTodo(null);
                            setActiveColumnId(null);
                          }}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => void handleToggleCard(todo)}
                              className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border text-[10px] font-bold transition ${
                                todo.completed
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              ✓
                            </button>

                            <div className="min-w-0 flex-1">
                              <h3
                                className={`text-sm font-semibold text-slate-900 ${
                                  todo.completed ? "line-through opacity-60" : ""
                                }`}
                              >
                                {todo.title}
                              </h3>

                              {todo.description ? (
                                <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                                  {todo.description}
                                </p>
                              ) : (
                                <p className="mt-2 text-sm text-slate-400">
                                  No description yet.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                            <span>Updated {formatRelativeDate(todo.updatedAt)}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditCardDialog(todo)}
                                className="rounded-lg border border-slate-200 px-2.5 py-1 font-medium text-slate-600 transition hover:bg-slate-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteCardDialog(todo)}
                                className="rounded-lg border border-rose-200 px-2.5 py-1 font-medium text-rose-600 transition hover:bg-rose-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}

                      {todos.length === 0 ? (
                        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center text-sm leading-6 text-slate-500">
                          No cards in this column yet. Add one above or drag a card
                          here.
                        </div>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AppDialog
        open={columnDialog?.mode === "edit"}
        title="Edit column"
        description="Review the column details before saving changes."
        onClose={() => !pending && setColumnDialog(null)}
        footer={
          columnDialog?.mode === "edit" ? (
            <>
              <button
                type="button"
                onClick={() => setColumnDialog(null)}
                disabled={pending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitColumnEdit()}
                disabled={pending || columnDialog.title.trim().length === 0}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save changes
              </button>
            </>
          ) : null
        }
      >
        {columnDialog?.mode === "edit" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel>Column Name</FieldLabel>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                value={columnDialog.title}
                onChange={(event) =>
                  setColumnDialog((current) =>
                    current?.mode === "edit"
                      ? { ...current, title: event.target.value }
                      : current
                  )
                }
                placeholder="Column title"
                maxLength={COLUMN_TITLE_MAX_LENGTH}
              />
              <p className="text-right text-xs text-slate-400">
                {columnDialog.title.length}/{COLUMN_TITLE_MAX_LENGTH}
              </p>
            </div>
            <div className="space-y-2">
              <FieldLabel>Color</FieldLabel>
              <ColorPicker
                value={columnDialog.color}
                onChange={(value) =>
                  setColumnDialog((current) =>
                    current?.mode === "edit" ? { ...current, color: value } : current
                  )
                }
              />
            </div>
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={columnDialog?.mode === "delete"}
        title="Delete column"
        description={
          columnDialog?.mode === "delete"
            ? `Cards in ${columnDialog.column.title} will be moved automatically to another column before deletion.`
            : undefined
        }
        onClose={() => !pending && setColumnDialog(null)}
        footer={
          columnDialog?.mode === "delete" ? (
            <>
              <button
                type="button"
                onClick={() => setColumnDialog(null)}
                disabled={pending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Keep column
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteColumn()}
                disabled={pending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete column
              </button>
            </>
          ) : null
        }
      >
        {columnDialog?.mode === "delete" ? (
          <p className="text-sm leading-6 text-slate-600">
            This action cannot be undone from the UI. Please confirm before we
            call the API.
          </p>
        ) : null}
      </AppDialog>

      <AppDialog
        open={cardDialog?.mode === "edit"}
        title="Edit card"
        description="Update the task details, then save when you are ready."
        onClose={() => !pending && setCardDialog(null)}
        footer={
          cardDialog?.mode === "edit" ? (
            <>
              <button
                type="button"
                onClick={() => setCardDialog(null)}
                disabled={pending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitCardEdit()}
                disabled={pending || cardDialog.title.trim().length === 0}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save card
              </button>
            </>
          ) : null
        }
      >
        {cardDialog?.mode === "edit" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel>Title</FieldLabel>
              <input
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                value={cardDialog.title}
                onChange={(event) =>
                  setCardDialog((current) =>
                    current?.mode === "edit"
                      ? { ...current, title: event.target.value }
                      : current
                  )
                }
                placeholder="Card title"
                maxLength={TODO_TITLE_MAX_LENGTH}
              />
              <p className="text-right text-xs text-slate-400">
                {cardDialog.title.length}/{TODO_TITLE_MAX_LENGTH}
              </p>
            </div>
            <div className="space-y-2">
              <FieldLabel>Description</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                value={cardDialog.description}
                onChange={(event) =>
                  setCardDialog((current) =>
                    current?.mode === "edit"
                      ? { ...current, description: event.target.value }
                      : current
                  )
                }
                placeholder="Describe this card"
                maxLength={TODO_DESCRIPTION_MAX_LENGTH}
              />
              <p className="text-right text-xs text-slate-400">
                {cardDialog.description.length}/{TODO_DESCRIPTION_MAX_LENGTH}
              </p>
            </div>
          </div>
        ) : null}
      </AppDialog>

      <AppDialog
        open={cardDialog?.mode === "delete"}
        title="Delete card"
        description={
          cardDialog?.mode === "delete"
            ? `You are about to remove ${cardDialog.todo.title}.`
            : undefined
        }
        onClose={() => !pending && setCardDialog(null)}
        footer={
          cardDialog?.mode === "delete" ? (
            <>
              <button
                type="button"
                onClick={() => setCardDialog(null)}
                disabled={pending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteCard()}
                disabled={pending}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete card
              </button>
            </>
          ) : null
        }
      >
        {cardDialog?.mode === "delete" ? (
          <p className="text-sm leading-6 text-slate-600">
            Please confirm before we send the delete request.
          </p>
        ) : null}
      </AppDialog>
    </>
  );
}
