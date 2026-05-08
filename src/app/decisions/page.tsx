"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useDecisions, useDeleteDecision } from "@/hooks/use-decisions";
import { usePatients } from "@/hooks/use-patients";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 10;

const emptyFilters = {
  patientId: "",
  createdDate: "",
  diseaseProbabilityMin: "",
  diseaseProbabilityMax: "",
};

export default function DecisionsPage() {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("createdDate,desc");
  const [filters, setFilters] = useState(emptyFilters);
  const debouncedFilters = useDebounce(filters, 300);
  const { data, isLoading } = useDecisions({ page, size: PAGE_SIZE, sort }, debouncedFilters);
  const { data: patientsData } = usePatients({ page: 0, size: 1000 });
  const deleteDecision = useDeleteDecision();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);

  const patientMap = useMemo(() => {
    const map = new Map<string, { firstName: string; lastName: string }>();
    patientsData?.content?.forEach((p) =>
      map.set(p.id, { firstName: p.firstName, lastName: p.lastName })
    );
    return map;
  }, [patientsData]);

  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const patientDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!patientDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target as Node)) {
        setPatientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [patientDropdownOpen]);

  const decisions = data?.content;

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteDecision.mutate(deleteTarget.id, {
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

  const selectedPatient = filters.patientId ? patientMap.get(filters.patientId) : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-bold">Решения</h1>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Удалить решение? Привязанные обследования сохранятся и станут доступны для новых решений.
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
                disabled={deleteDecision.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteDecision.isPending ? "Удаление..." : "Удалить"}
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
                <th className="pb-2 font-medium">Пациент</th>
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("createdDate")}
                >
                  Дата{sortIndicator("createdDate")}
                </th>
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("diseaseProbability")}
                >
                  Вероятность{sortIndicator("diseaseProbability")}
                </th>
                <th className="pb-2 font-medium">Обследований</th>
                <th className="pb-2 font-medium">Комментарий</th>
                <th className="pb-2 font-medium"></th>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="pb-2 pt-1">
                  <div ref={patientDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
                      className={`${filterSelectClass} flex items-center justify-between bg-white text-left`}
                    >
                      <span className={filters.patientId ? "text-gray-900" : "text-gray-400"}>
                        {selectedPatient
                          ? `${selectedPatient.firstName} ${selectedPatient.lastName}`
                          : "Все"}
                      </span>
                      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {patientDropdownOpen && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                        <li
                          onClick={() => { updateFilter("patientId", ""); setPatientDropdownOpen(false); }}
                          className={`cursor-pointer px-3 py-1.5 text-xs hover:bg-gray-100 ${!filters.patientId ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                        >
                          Все
                        </li>
                        {patientsData?.content?.map((p) => (
                          <li
                            key={p.id}
                            onClick={() => { updateFilter("patientId", p.id); setPatientDropdownOpen(false); }}
                            className={`cursor-pointer px-3 py-1.5 text-xs hover:bg-gray-100 ${filters.patientId === p.id ? "bg-blue-50 text-blue-700" : "text-gray-900"}`}
                          >
                            {p.firstName} {p.lastName}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="от"
                      value={filters.diseaseProbabilityMin}
                      onChange={(e) => updateFilter("diseaseProbabilityMin", e.target.value)}
                      className={filterInputClass}
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      placeholder="до"
                      value={filters.diseaseProbabilityMax}
                      onChange={(e) => updateFilter("diseaseProbabilityMax", e.target.value)}
                      className={filterInputClass}
                    />
                  </div>
                </th>
                <th></th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {decisions?.map((d) => {
                const p = patientMap.get(d.patientId);
                return (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="py-3">
                      {p ? (
                        <Link href={`/patients/${d.patientId}`} className="text-blue-600 hover:underline">
                          {p.firstName} {p.lastName}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="py-3">
                      {new Date(d.createdDate).toLocaleDateString("ru-RU")}
                    </td>
                    <td className="py-3">
                      {d.diseaseProbability != null
                        ? `${(d.diseaseProbability * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="py-3">{d.examinations.length}</td>
                    <td className="py-3 max-w-xs truncate text-gray-600">
                      {d.doctorComment || "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/decisions/${d.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Открыть
                        </Link>
                        <button
                          onClick={() => setDeleteTarget({ id: d.id })}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data?.empty && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Решений не найдено.
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