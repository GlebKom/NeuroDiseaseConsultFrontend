import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { keycloakLogout } from "@/lib/keycloak-server";

export async function POST() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (session.refreshToken) {
    await keycloakLogout(session.refreshToken).catch(() => {});
  }

  session.destroy();

  return NextResponse.json({ success: true });
}
