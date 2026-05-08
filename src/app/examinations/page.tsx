"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useExaminations, useAvailableExaminationTypes, useDeleteExamination } from "@/hooks/use-examinations";
import { usePatients } from "@/hooks/use-patients";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/pagination";
import type { ExaminationStatus } from "@/types";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<string, string> = {
  UPLOADED: "Загружено",
  PROCESSING: "В обработке",
  COMPLETED: "Завершено",
  FAILED: "Ошибка",
};

const STATUS_COLORS: Record<string, string> = {
  UPLOADED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS: ExaminationStatus[] = ["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"];

const emptyFilters = {
  name: "",
  examinationType: "",
  patientFirstName: "",
  patientLastName: "",
  createdDate: "",
  status: "",
};

export default function ExaminationsPage() {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("createdDate,desc");
  const [filters, setFilters] = useState(emptyFilters);
  const debouncedFilters = useDebounce(filters, 300);
  const { data, isLoading } = useExaminations({ page, size: PAGE_SIZE, sort }, debouncedFilters);
  const { data: examTypes } = useAvailableExaminationTypes();
  const { data: patientsData } = usePatients({ page: 0, size: 1000 });
  const deleteExamination = useDeleteExamination();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const patientMap = useMemo(() => {
    const map = new Map<string, { firstName: string; lastName: string }>();
    patientsData?.content?.forEach((p) => map.set(p.id, { firstName: p.firstName, lastName: p.lastName }));
    return map;
  }, [patientsData]);

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!typeDropdownOpen && !statusDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (typeDropdownOpen && typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (statusDropdownOpen && statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [typeDropdownOpen, statusDropdownOpen]);

  const examinations = data?.content;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteExamination.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const toggleSort = (field: string) => {
    const [currentField, currentDir] = sort.split(",");
    if (currentField === field) {
      setSort(`${field},${currentDir === "asc" ? "desc" : "asc"}`);
    } else {
      setSort(`${field},asc`);
    }
    setPage(0);
  };

  const sortIndicator = (field: string) => {
    const [currentField, currentDir] = sort.split(",");
    if (currentField !== field) return null;
    return currentDir === "asc" ? " \u2191" : " \u2193";
  };

  const filterInputClass =
    "w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none";

  const filterSelectClass =
    "w-full rounded border border-gray-200 px-2 py-1 text-xs font-normal text-gray-900 focus:border-blue-400 focus:outline-none";

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">Обследования</h1>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Вы уверены, что хотите удалить обследование{" "}
              <span className="font-bold text-gray-900">{deleteTarget.name}</span>?
              Это действие нельзя будет отменить.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteExamination.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteExamination.isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && <p className="mt-8 text-gray-500">Загрузка...</p>}

      {!isLoading && (
        <>
          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("name")}
                >
                  Название{sortIndicator("name")}
                </th>
                <th className="pb-2 font-medium">Тип</th>
                <th className="pb-2 font-medium">Имя</th>
                <th className="pb-2 font-medium">Фамилия</th>
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("createdDate")}
                >
                  Дата{sortIndicator("createdDate")}
                </th>
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("status")}
                >
                  Статус{sortIndicator("status")}
                </th>
                <th className="pb-2 font-medium"></th>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="pb-2 pt-1">
                  <input
                    placeholder="Поиск..."
                    value={filters.name}
                    onChange={(e) => updateFilter("name", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <div ref={typeDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setStatusDropdownOpen(false); }}
                      className={`${filterSelectClass} flex items-center justify-between bg-white text-left`}
                    >
                      <span className={filters.examinationType ? "text-gray-900" : "text-gray-400"}>
                        {examTypes?.find((t) => t.examinationType === filters.examinationType)?.examinationTypeName || "Все"}
                      </span>
                      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {typeDropdownOpen && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        <li
                          onClick={() => { updateFilter("examinationType", ""); setTypeDropdownOpen(false); }}
                          className={`cursor-pointer px-3 py-1.5 text-xs hover:bg-gray-100 ${!filters.examinationType ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                        >
                          Все
                        </li>
                        {examTypes?.map((t) => (
                          <li
                            key={t.examinationType}
                            onClick={() => { updateFilter("examinationType", t.examinationType); setTypeDropdownOpen(false); }}
                            className={`cursor-pointer px-3 py-1.5 text-xs hover:bg-gray-100 ${filters.examinationType === t.examinationType ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                          >
                            {t.examinationTypeName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </th>
                <th className="pb-2 pt-1">
                  <input
                    placeholder="Поиск..."
                    value={filters.patientFirstName}
                    onChange={(e) => updateFilter("patientFirstName", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <input
                    placeholder="Поиск..."
                    value={filters.patientLastName}
                    onChange={(e) => updateFilter("patientLastName", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <input
                    type="date"
                    value={filters.createdDate}
                    onChange={(e) => updateFilter("createdDate", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <div ref={statusDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setTypeDropdownOpen(false); }}
                      className={`${filterSelectClass} flex items-center justify-between bg-white text-left`}
                    >
                      <span className={filters.status ? "text-gray-900" : "text-gray-400"}>
                        {filters.status ? STATUS_LABELS[filters.status] : "Все"}
                      </span>
                      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {statusDropdownOpen && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        <li
                          onClick={() => { updateFilter("status", ""); setStatusDropdownOpen(false); }}
                          className={`cursor-pointer px-3 py-1.5 text-xs hover:bg-gray-100 ${!filters.status ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                        >
                          Все
                        </li>
                        {STATUS_OPTIONS.map((s) => (
                          <li
                            key={s}
                            onClick={() => { updateFilter("status", s); setStatusDropdownOpen(false); }}
                            className={`cursor-pointer px-3 py-1.5 text-xs hover:bg-gray-100 ${filters.status === s ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                          >
                            {STATUS_LABELS[s]}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {examinations?.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-3">{e.name}</td>
                  <td className="py-3">{examTypes?.find((t) => t.examinationType === e.examinationType)?.examinationTypeName || e.examinationType}</td>
                  <td className="py-3">
                    {patientMap.get(e.patientId) ? (
                      <Link href={`/patients/${e.patientId}`} className="text-blue-600 hover:underline">
                        {patientMap.get(e.patientId)!.firstName}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="py-3">
                    {patientMap.get(e.patientId) ? (
                      <Link href={`/patients/${e.patientId}`} className="text-blue-600 hover:underline">
                        {patientMap.get(e.patientId)!.lastName}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="py-3">
                    {new Date(e.createdDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status] || ""}`}
                    >
                      {STATUS_LABELS[e.status] || e.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/patients/${e.patientId}/examinations/${e.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Открыть
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: e.id, name: e.name })}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data?.empty && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Обследований не найдено.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {data && (
            <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </main>
  );
}
