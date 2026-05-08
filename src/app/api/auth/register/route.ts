import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, UserProfile, sessionOptions } from "@/lib/session";
import {
  getAdminToken,
  loginWithCredentials,
  parseJwtPayload,
} from "@/lib/keycloak-server";
import { isRateLimited } from "@/lib/rate-limit";

const KEYCLOAK_URL = process.env.KEYCLOAK_URL!;
const REALM = process.env.KEYCLOAK_REALM!;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (isRateLimited(`register:${ip}`, { maxRequests: 5, windowMs: 60_000 })) {
    return NextResponse.json(
      { error: "Слишком много попыток. Попробуйте позже." },
      { status: 429 }
    );
  }

  try {
    const { firstName, lastName, email, username, password } =
      await request.json();

    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json(
        { error: "Все поля обязательны для заполнения" },
        { status: 400 }
      );
    }

    const adminToken = await getAdminToken();

    const createRes = await fetch(
      `${KEYCLOAK_URL}/admin/realms/${REALM}/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          username,
          enabled: true,
          credentials: [
            {
              type: "password",
              value: password,
              temporary: false,
            },
          ],
        }),
      }
    );

    if (createRes.status === 409) {
      return NextResponse.json(
        { error: "Пользователь с таким username или email уже существует" },
        { status: 409 }
      );
    }

    if (!createRes.ok) {
      console.error("Keycloak create user error — status:", createRes.status);
      return NextResponse.json(
        { error: "Не удалось создать пользователя" },
        { status: 500 }
      );
    }

    // Auto-login after registration
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

    return NextResponse.json({ user: userProfile }, { status: 201 });
  } catch {
    console.error("Registration error");
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
