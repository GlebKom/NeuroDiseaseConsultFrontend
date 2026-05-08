import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "./session";
import { refreshAccessToken } from "./keycloak-server";

const MIN_VALIDITY_MS = 30 * 1000;

export async function getValidSession(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );

  if (!session.accessToken || !session.refreshToken) {
    return null;
  }

  if (session.expiresAt - Date.now() < MIN_VALIDITY_MS) {
    try {
      const tokens = await refreshAccessToken(session.refreshToken);
      session.accessToken = tokens.access_token;
      session.refreshToken = tokens.refresh_token;
      session.expiresAt = Date.now() + tokens.expires_in * 1000;
      await session.save();
    } catch {
      session.destroy();
      return null;
    }
  }

  return session;
}
