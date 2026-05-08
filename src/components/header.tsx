"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { logout } from "@/lib/auth";

export function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated) return null;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold text-gray-900">
            NeuroDiseaseConsult
          </span>
          <Link
            href="/patients"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Пациенты
          </Link>
          <Link
            href="/examinations"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Обследования
          </Link>
          <Link
            href="/decisions"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Решения
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {user?.name || user?.preferredUsername}
          </span>
          <button
            onClick={() => logout()}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
}
