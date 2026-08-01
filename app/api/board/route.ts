import { NextResponse } from "next/server";

import { getBoardData } from "@/lib/board";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getBoardData();

    return NextResponse.json(
      { data },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load board data.",
      },
      { status: 500 }
    );
  }
}
