import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, UserProfile, sessionOptions } from "@/lib/session";
import { loginWithCredentials, parseJwtPayload } from "@/lib/keycloak-server";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(`login:${ip}`, { maxRequests: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 }
    );
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Имя пользователя и пароль обязательны" },
        { status: 400 }
      );
    }

    const tokens = await loginWithCredentials(username, password);
    const payload = parseJwtPayload(tokens.access_token);

    const userProfile: UserProfile = {
      sub: payload.sub as string,
      name: payload.name as string | undefined,
      email: payload.email as string | undefined,
      preferredUsername: payload.preferred_username as string | undefined,
      realmRoles: (payload.realm_access as { roles?: string[] })?.roles ?? [],
    };

    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    session.accessToken = tokens.access_token;
    session.refreshToken = tokens.refresh_token;
    session.expiresAt = Date.now() + tokens.expires_in * 1000;
    session.userProfile = userProfile;
    await session.save();

    return NextResponse.json({ user: userProfile });
  } catch {
    return NextResponse.json(
      { error: "Неверные учётные данные" },
      { status: 401 }
    );
  }
}
