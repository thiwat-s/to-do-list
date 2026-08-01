import { NextRequest, NextResponse } from "next/server";

import { getNextColumnOrder, pickNextColumnColor } from "@/lib/board";
import { isColumnColor } from "@/lib/column-colors";
import { connectToDatabase } from "@/lib/mongoose";
import { COLUMN_TITLE_MAX_LENGTH } from "@/lib/validation";
import Column from "@/models/Column";

function validateColumnPayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return "Request body must be an object.";
  }

  const { title, color } = body as { title?: unknown; color?: unknown };

  if (typeof title !== "string" || title.trim().length === 0) {
    return "title is required.";
  }

  if (title.trim().length > COLUMN_TITLE_MAX_LENGTH) {
    return `title must be at most ${COLUMN_TITLE_MAX_LENGTH} characters.`;
  }

  if (color !== undefined && !isColumnColor(color)) {
    return "color is invalid.";
  }

  return null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const error = validateColumnPayload(body);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  await connectToDatabase();

  const column = await Column.create({
    title: body.title.trim(),
    color: body.color ?? (await pickNextColumnColor()),
    order: await getNextColumnOrder(),
  });

  return NextResponse.json({ data: column }, { status: 201 });
}
