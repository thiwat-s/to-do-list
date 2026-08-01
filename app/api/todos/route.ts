import { NextRequest, NextResponse } from "next/server";

import { getNextTodoOrder } from "@/lib/board";
import { connectToDatabase } from "@/lib/mongoose";
import {
  TODO_DESCRIPTION_MAX_LENGTH,
  TODO_TITLE_MAX_LENGTH,
} from "@/lib/validation";
import Todo from "@/models/Todo";

function validateCreatePayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return "Request body must be an object.";
  }

  const { title, description, completed, columnId } = body as {
    title?: unknown;
    description?: unknown;
    completed?: unknown;
    columnId?: unknown;
  };

  if (typeof title !== "string" || title.trim().length === 0) {
    return "title is required.";
  }

  if (title.trim().length > TODO_TITLE_MAX_LENGTH) {
    return `title must be at most ${TODO_TITLE_MAX_LENGTH} characters.`;
  }

  if (typeof columnId !== "string" || columnId.trim().length === 0) {
    return "columnId is required.";
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

  return null;
}

export async function GET() {
  await connectToDatabase();

  const todos = await Todo.find().sort({ columnId: 1, order: 1 }).lean();

  return NextResponse.json({ data: todos });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const error = validateCreatePayload(body);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await connectToDatabase();

  const normalizedColumnId = body.columnId.trim();

  const todo = await Todo.create({
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    columnId: normalizedColumnId,
    order:
      typeof body.order === "number"
        ? body.order
        : await getNextTodoOrder(normalizedColumnId),
    completed: body.completed ?? false,
  });

  return NextResponse.json({ data: todo }, { status: 201 });
}
