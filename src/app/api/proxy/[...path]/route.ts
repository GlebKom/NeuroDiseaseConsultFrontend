import { NextRequest, NextResponse } from "next/server";
import { getValidSession } from "@/lib/session-helpers";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:8080/api";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getValidSession();

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { path } = await params;
  const targetPath = path.join("/");
  const url = new URL(`${BACKEND_API_URL}/${targetPath}`);

  // Forward query parameters
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  // Forward content-type for non-multipart requests
  const contentType = request.headers.get("content-type");
  if (contentType && !contentType.includes("multipart/form-data")) {
    headers.set("Content-Type", contentType);
  } else if (contentType?.includes("multipart/form-data")) {
    // Let fetch set the correct boundary for multipart
    headers.set("Content-Type", contentType);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    // @ts-expect-error -- Node fetch supports duplex streaming
    init.duplex = "half";
  }

  const backendRes = await fetch(url.toString(), init);

  const responseHeaders = new Headers();
  const resContentType = backendRes.headers.get("content-type");
  if (resContentType) {
    responseHeaders.set("Content-Type", resContentType);
  }

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
