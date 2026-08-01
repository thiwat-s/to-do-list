import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import Column from "@/models/Column";
import Todo from "@/models/Todo";
import { isColumnColor } from "@/lib/column-colors";
import { connectToDatabase } from "@/lib/mongoose";
import { COLUMN_TITLE_MAX_LENGTH } from "@/lib/validation";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/columns/[id]">
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid column id." }, { status: 400 });
  }

  const body = await request.json();
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const color = body?.color;

  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  if (title.length > COLUMN_TITLE_MAX_LENGTH) {
    return NextResponse.json(
      { error: `title must be at most ${COLUMN_TITLE_MAX_LENGTH} characters.` },
      { status: 400 }
    );
  }

  if (color !== undefined && !isColumnColor(color)) {
    return NextResponse.json({ error: "color is invalid." }, { status: 400 });
  }

  await connectToDatabase();

  const updates: Record<string, unknown> = { title };

  if (color !== undefined) {
    updates.color = color;
  }

  const column = await Column.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  if (!column) {
    return NextResponse.json({ error: "Column not found." }, { status: 404 });
  }

  return NextResponse.json({ data: column });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/columns/[id]">
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid column id." }, { status: 400 });
  }

  await connectToDatabase();

  const columns = await Column.find().sort({ order: 1 }).lean();

  if (columns.length <= 1) {
    return NextResponse.json(
      { error: "At least one column must remain." },
      { status: 400 }
    );
  }

  const targetColumn = columns.find((column) => String(column._id) !== id);

  if (!targetColumn) {
    return NextResponse.json(
      { error: "No fallback column available." },
      { status: 400 }
    );
  }

  const targetColumnId = String(targetColumn._id);
  const movedTodos = await Todo.find({ columnId: id })
    .sort({ order: 1, createdAt: 1 })
    .lean();
  const targetTodos = await Todo.find({ columnId: targetColumnId })
    .sort({ order: -1 })
    .lean();
  const nextOrderStart = Number(targetTodos[0]?.order ?? -1) + 1;

  if (movedTodos.length > 0) {
    await Todo.bulkWrite(
      movedTodos.map((todo, index) => ({
        updateOne: {
          filter: { _id: todo._id },
          update: {
            $set: {
              columnId: targetColumnId,
              order: nextOrderStart + index,
            },
          },
        },
      }))
    );
  }

  await Column.findByIdAndDelete(id);

  const remainingColumns = await Column.find().sort({ order: 1 }).lean();

  await Column.bulkWrite(
    remainingColumns.map((column, index) => ({
      updateOne: {
        filter: { _id: column._id },
        update: { $set: { order: index } },
      },
    }))
  );

  return NextResponse.json({
    data: {
      deletedId: id,
      movedTo: targetColumnId,
    },
  });
}
