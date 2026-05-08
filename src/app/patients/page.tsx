"use client";

import { useState } from "react";
import Link from "next/link";
import { usePatients, useCreatePatient, useDeletePatient } from "@/hooks/use-patients";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/pagination";
import type { CreatePatientRequest } from "@/types";

const PAGE_SIZE = 10;

const emptyForm: CreatePatientRequest = {
  firstName: "",
  lastName: "",
  birthDate: "",
  medicalRecordNumber: "",
  diagnosisHistory: "",
};

const emptyFilters = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  medicalRecordNumber: "",
};

export default function PatientsPage() {
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("lastName,asc");
  const [filters, setFilters] = useState(emptyFilters);
  const debouncedFilters = useDebounce(filters, 300);
  const { data, isLoading } = usePatients({ page, size: PAGE_SIZE, sort }, debouncedFilters);
  const createPatient = useCreatePatient();
  const deletePatient = useDeletePatient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreatePatientRequest>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const patients = data?.content;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(form, {
      onSuccess: () => {
        setForm(emptyForm);
        setShowForm(false);
      },
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deletePatient.mutate(deleteTarget.id, {
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

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Пациенты</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          {showForm ? "Отмена" : "Добавить пациента"}
        </button>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Вы уверены, что хотите удалить пациента{" "}
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
                disabled={deletePatient.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletePatient.isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Имя</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Фамилия</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Дата рождения</label>
              <input
                required
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Номер мед. карты</label>
              <input
                required
                value={form.medicalRecordNumber}
                onChange={(e) => setForm({ ...form, medicalRecordNumber: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">История диагнозов</label>
            <textarea
              value={form.diagnosisHistory}
              onChange={(e) => setForm({ ...form, diagnosisHistory: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={createPatient.isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createPatient.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </form>
      )}

      {isLoading && <p className="mt-8 text-gray-500">Загрузка...</p>}

      {!isLoading && (
        <>
          <table className="mt-6 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("firstName")}
                >
                  Имя{sortIndicator("firstName")}
                </th>
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("lastName")}
                >
                  Фамилия{sortIndicator("lastName")}
                </th>
                <th
                  className="pb-2 font-medium cursor-pointer hover:text-gray-900 select-none"
                  onClick={() => toggleSort("dateOfBirth")}
                >
                  Дата рождения{sortIndicator("dateOfBirth")}
                </th>
                <th className="pb-2 font-medium">Номер карты</th>
                <th className="pb-2 font-medium"></th>
              </tr>
              <tr className="border-b border-gray-100">
                <th className="pb-2 pt-1">
                  <input
                    placeholder="Поиск..."
                    value={filters.firstName}
                    onChange={(e) => updateFilter("firstName", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <input
                    placeholder="Поиск..."
                    value={filters.lastName}
                    onChange={(e) => updateFilter("lastName", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <input
                    type="date"
                    value={filters.dateOfBirth}
                    onChange={(e) => updateFilter("dateOfBirth", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th className="pb-2 pt-1">
                  <input
                    placeholder="Поиск..."
                    value={filters.medicalRecordNumber}
                    onChange={(e) => updateFilter("medicalRecordNumber", e.target.value)}
                    className={filterInputClass}
                  />
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients?.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-3">{p.firstName}</td>
                  <td className="py-3">{p.lastName}</td>
                  <td className="py-3">{p.dateOfBirth}</td>
                  <td className="py-3">{p.medicalRecordNumber}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/patients/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Открыть
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: p.id, name: p.firstName + " " + p.lastName })}
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
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Пациентов не найдено.
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
