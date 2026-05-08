import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

const PUBLIC_PATHS = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Create a response we can read cookies from
  const response = NextResponse.next();

  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  const isAuthenticated = !!session.accessToken;

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle auth themselves)
     * - _next/static, _next/image (static files)
     * - favicon.ico, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
