"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { checkSession } from "@/lib/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Загрузка...
      </div>
    );
  }

  return <>{children}</>;
}
