import { unstable_noStore as noStore } from "next/cache";

import Column from "@/models/Column";
import Todo from "@/models/Todo";
import { connectToDatabase } from "@/lib/mongoose";
import type { BoardData, ColumnItem, TodoItem } from "@/components/types";

const DEFAULT_COLUMNS = [
  { title: "Inbox", color: "slate", order: 0 },
  { title: "In Progress", color: "blue", order: 1 },
  { title: "Review", color: "amber", order: 2 },
  { title: "Done", color: "emerald", order: 3 },
] as const;

const COLUMN_COLORS = [
  "slate",
  "blue",
  "violet",
  "amber",
  "emerald",
  "rose",
  "teal",
] as const;

function toIsoDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

function serializeColumn(column: Record<string, unknown>): ColumnItem {
  return {
    _id: String(column._id),
    title: String(column.title ?? "Untitled"),
    color: String(column.color ?? "slate"),
    order: Number(column.order ?? 0),
    createdAt: toIsoDate(column.createdAt),
    updatedAt: toIsoDate(column.updatedAt),
  };
}

function serializeTodo(todo: Record<string, unknown>): TodoItem {
  return {
    _id: String(todo._id),
    title: String(todo.title ?? "Untitled"),
    description: String(todo.description ?? ""),
    columnId: String(todo.columnId ?? ""),
    order: Number(todo.order ?? 0),
    completed: Boolean(todo.completed),
    createdAt: toIsoDate(todo.createdAt),
    updatedAt: toIsoDate(todo.updatedAt),
  };
}

export async function ensureDefaultColumns() {
  noStore();
  await connectToDatabase();

  let columns = await Column.find().sort({ order: 1 }).lean();

  if (columns.length === 0) {
    await Column.insertMany(DEFAULT_COLUMNS);
    columns = await Column.find().sort({ order: 1 }).lean();
  }

  return columns;
}

export async function backfillTodosWithoutColumn() {
  noStore();
  const columns = await ensureDefaultColumns();
  const fallbackColumn = columns[0];

  const orphanTodos = await Todo.find({
    $or: [
      { columnId: { $exists: false } },
      { columnId: null },
      { columnId: "" },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  if (orphanTodos.length === 0) {
    return columns;
  }

  const startingOrder = Date.now();

  await Todo.bulkWrite(
    orphanTodos.map((todo, index) => ({
      updateOne: {
        filter: { _id: todo._id },
        update: {
          $set: {
            columnId: String(fallbackColumn._id),
            order: startingOrder + index,
          },
        },
      },
    }))
  );

  return columns;
}

export async function getBoardData(): Promise<BoardData> {
  noStore();
  const columns = await backfillTodosWithoutColumn();
  const serializedColumns = columns.map((column) =>
    serializeColumn(column as unknown as Record<string, unknown>)
  );

  const todos = await Todo.find()
    .sort({ columnId: 1, order: 1, createdAt: 1 })
    .lean();

  return {
    columns: serializedColumns,
    todos: todos.map((todo) =>
      serializeTodo(todo as unknown as Record<string, unknown>)
    ),
  };
}

export async function getNextColumnOrder() {
  noStore();
  await ensureDefaultColumns();
  const column = await Column.findOne().sort({ order: -1 }).lean();
  return Number(column?.order ?? -1) + 1;
}

export async function getNextTodoOrder(columnId: string) {
  noStore();
  await connectToDatabase();
  const todo = await Todo.findOne({ columnId }).sort({ order: -1 }).lean();
  return Number(todo?.order ?? -1) + 1;
}

export async function pickNextColumnColor() {
  noStore();
  const columns = await ensureDefaultColumns();
  return COLUMN_COLORS[columns.length % COLUMN_COLORS.length];
}
