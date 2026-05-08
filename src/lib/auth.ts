import { useAuthStore, UserProfile } from "@/store/auth.store";

export async function login(
  username: string,
  password: string
): Promise<UserProfile> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Ошибка авторизации");
  }

  const { user } = await res.json();
  useAuthStore.getState().setUser(user);
  return user;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  useAuthStore.getState().clearUser();
  window.location.href = "/login";
}

const PUBLIC_PATHS = ["/login", "/register"];

function redirectToLogin() {
  if (!PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p))) {
    window.location.href = "/login";
  }
}

export async function checkSession(): Promise<UserProfile | null> {
  try {
    const res = await fetch("/api/auth/me");

    if (!res.ok) {
      useAuthStore.getState().clearUser();
      redirectToLogin();
      return null;
    }

    const { user } = await res.json();
    useAuthStore.getState().setUser(user);
    return user;
  } catch {
    useAuthStore.getState().clearUser();
    redirectToLogin();
    return null;
  }
}
