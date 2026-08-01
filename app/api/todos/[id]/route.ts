import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectToDatabase } from "@/lib/mongoose";
import {
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from "@/lib/validation";
import Todo from "@/models/Todo";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateUpdatePayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return "Request body must be an object.";
  }

  const { title, description, completed, columnId, order } = body as {
    title?: unknown;
    description?: unknown;
    completed?: unknown;
    columnId?: unknown;
    order?: unknown;
  };

  if (
    title !== undefined &&
    (typeof title !== "string" || title.trim().length === 0)
  ) {
    return "title must be a non-empty string.";
  }

  if (
    typeof title === "string" &&
    title.trim().length > TODO_TITLE_MAX_LENGTH
  ) {
    return `title must be at most ${TODO_TITLE_MAX_LENGTH} characters.`;
  }

  if (description !== undefined && typeof description !== "string") {
    return "description must be a string.";
  }

  if (
    typeof description === "string" &&
    description.trim().length > TODO_DESCRIPTION_MAX_LENGTH
  ) {
    return `description must be at most ${TODO_DESCRIPTION_MAX_LENGTH} characters.`;
  }

  if (completed !== undefined && typeof completed !== "boolean") {
    return "completed must be a boolean.";
  }

  if (columnId !== undefined && typeof columnId !== "string") {
    return "columnId must be a string.";
  }

  if (order !== undefined && typeof order !== "number") {
    return "order must be a number.";
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/todos/[id]">
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
  }

  await connectToDatabase();

  const todo = await Todo.findById(id).lean();

  if (!todo) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json({ data: todo });
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/todos/[id]">
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
  }

  const body = await request.json();
  const error = validateUpdatePayload(body);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await connectToDatabase();

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) {
    updates.title = body.title.trim();
  }

  if (body.description !== undefined) {
    updates.description = body.description.trim();
  }

  if (body.completed !== undefined) {
    updates.completed = body.completed;
  }

  if (body.columnId !== undefined) {
    updates.columnId = body.columnId.trim();
  }

  if (body.order !== undefined) {
    updates.order = body.order;
  }

  const todo = await Todo.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).lean();

  if (!todo) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json({ data: todo });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/todos/[id]">
) {
  const { id } = await context.params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid todo id." }, { status: 400 });
  }

  await connectToDatabase();

  const todo = await Todo.findByIdAndDelete(id).lean();

  if (!todo) {
    return NextResponse.json({ error: "Todo not found." }, { status: 404 });
  }

  return NextResponse.json({ data: todo });
}
