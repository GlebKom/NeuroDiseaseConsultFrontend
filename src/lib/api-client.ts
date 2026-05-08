async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api/proxy${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function uploadFile(
  path: string,
  file: File,
  queryParams?: Record<string, string>
): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);

  const query = queryParams
    ? "?" + new URLSearchParams(queryParams).toString()
    : "";

  const res = await fetch(`/api/proxy${path}${query}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload error: ${res.status} ${res.statusText}`);
  }

  return res;
}

export async function downloadFile(path: string, fileName: string): Promise<void> {
  const res = await fetch(`/api/proxy${path}`);

  if (!res.ok) {
    throw new Error(`Download error: ${res.status} ${res.statusText}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

import type { PageParams } from "@/types";

export function buildPageQuery(
  params: PageParams,
  filters?: Record<string, string>
): string {
  const search = new URLSearchParams();
  search.set("page", String(params.page));
  search.set("size", String(params.size));
  if (params.sort) search.set("sort", params.sort);
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) search.set(key, value);
    }
  }
  return search.toString();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
