import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/session-helpers";

export async function GET() {
  const session = await getValidSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user: session.userProfile });
}
