"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePatient, useUpdatePatient } from "@/hooks/use-patients";
import {
  usePatientExaminations,
  useCreateExamination,
  useDeleteExamination,
  useAvailableExaminationTypes,
} from "@/hooks/use-examinations";
import {
  useDecisions,
  useCreateDecision,
  useDeleteDecision,
} from "@/hooks/use-decisions";
import type { UpdatePatientRequest, CreateExaminationRequest, ExaminationType } from "@/types";

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

const emptyExamForm = {
  name: "",
  description: "",
  examinationType: "" as ExaminationType,
};

export default function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(patientId);
  const updatePatient = useUpdatePatient(patientId);
  const { data: examinations, isLoading: examsLoading } =
    usePatientExaminations(patientId, { page: 0, size: 1000, sort: "createdDate,desc" });
  const createExamination = useCreateExamination();
  const deleteExamination = useDeleteExamination();
  const { data: examTypes } = useAvailableExaminationTypes();
  const { data: decisionsPage, isLoading: decisionsLoading } = useDecisions(
    { page: 0, size: 100, sort: "createdDate,desc" },
    { patientId }
  );
  const createDecision = useCreateDecision();
  const deleteDecision = useDeleteDecision();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdatePatientRequest | null>(null);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [examForm, setExamForm] = useState(emptyExamForm);
  const [deleteExamTarget, setDeleteExamTarget] = useState<{ id: string; name: string } | null>(null);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showCreateDecision, setShowCreateDecision] = useState(false);
  const [decisionForm, setDecisionForm] = useState<{ examinationIds: string[]; doctorComment: string }>({
    examinationIds: [],
    doctorComment: "",
  });
  const [deleteDecisionTarget, setDeleteDecisionTarget] = useState<{ id: string } | null>(null);

  useEffect(() => {
    if (!typeDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [typeDropdownOpen]);

  const startEdit = () => {
    if (!patient) return;
    setForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: patient.dateOfBirth,
      medicalRecordNumber: patient.medicalRecordNumber,
      diagnosisHistory: patient.diagnosisHistory,
    });
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    updatePatient.mutate(form, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleCreateExamination = (e: React.FormEvent) => {
    e.preventDefault();
    const data: CreateExaminationRequest = {
      patientId,
      name: examForm.name,
      description: examForm.description,
      examinationType: examForm.examinationType,
    };
    createExamination.mutate(data, {
      onSuccess: () => {
        setExamForm(emptyExamForm);
        setShowCreateExam(false);
      },
    });
  };

  const confirmDeleteExamination = () => {
    if (!deleteExamTarget) return;
    deleteExamination.mutate(deleteExamTarget.id, {
      onSuccess: () => setDeleteExamTarget(null),
    });
  };

  const handleCreateDecision = (e: React.FormEvent) => {
    e.preventDefault();
    createDecision.mutate(
      { examinationIds: decisionForm.examinationIds, doctorComment: decisionForm.doctorComment },
      {
        onSuccess: () => {
          setDecisionForm({ examinationIds: [], doctorComment: "" });
          setShowCreateDecision(false);
        },
      }
    );
  };

  const toggleDecisionExamination = (id: string) => {
    setDecisionForm((prev) => ({
      ...prev,
      examinationIds: prev.examinationIds.includes(id)
        ? prev.examinationIds.filter((x) => x !== id)
        : [...prev.examinationIds, id],
    }));
  };

  const confirmDeleteDecision = () => {
    if (!deleteDecisionTarget) return;
    deleteDecision.mutate(deleteDecisionTarget.id, {
      onSuccess: () => setDeleteDecisionTarget(null),
    });
  };

  const decisions = decisionsPage?.content;
  const linkedExamIds = new Set(
    (decisions || []).flatMap((d) => d.examinations.map((e) => e.id))
  );
  const availableExamsForDecision = (examinations || []).filter(
    (e) => !linkedExamIds.has(e.id)
  );

  if (isLoading) return <p className="p-8 text-gray-500">Загрузка...</p>;
  if (!patient) return <p className="p-8 text-gray-500">Пациент не найден.</p>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Назад
      </button>

      {!editing ? (
        <div className="mt-4 rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <button
              onClick={startEdit}
              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            >
              Редактировать
            </button>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Дата рождения</dt>
              <dd>{patient.dateOfBirth}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Номер мед. карты</dt>
              <dd>{patient.medicalRecordNumber}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">История диагнозов</dt>
              <dd className="whitespace-pre-wrap">
                {patient.diagnosisHistory || "—"}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="mt-4 space-y-4 rounded-lg border border-gray-200 p-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Имя
              </label>
              <input
                required
                value={form!.firstName}
                onChange={(e) =>
                  setForm({ ...form!, firstName: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Фамилия
              </label>
              <input
                required
                value={form!.lastName}
                onChange={(e) =>
                  setForm({ ...form!, lastName: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Дата рождения
              </label>
              <input
                required
                type="date"
                value={form!.birthDate}
                onChange={(e) =>
                  setForm({ ...form!, birthDate: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Номер мед. карты
              </label>
              <input
                required
                value={form!.medicalRecordNumber}
                onChange={(e) =>
                  setForm({ ...form!, medicalRecordNumber: e.target.value })
                }
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              История диагнозов
            </label>
            <textarea
              value={form!.diagnosisHistory}
              onChange={(e) =>
                setForm({ ...form!, diagnosisHistory: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updatePatient.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updatePatient.isPending ? "Сохранение..." : "Сохранить"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Delete Examination Modal */}
      {deleteExamTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Вы уверены, что хотите удалить обследование{" "}
              <span className="font-bold text-gray-900">{deleteExamTarget.name}</span>?
              Это действие нельзя будет отменить.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteExamTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteExamination}
                disabled={deleteExamination.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteExamination.isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Examination Modal */}
      {showCreateExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Новое обследование
            </h2>
            <form onSubmit={handleCreateExamination} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Название
                </label>
                <input
                  required
                  value={examForm.name}
                  onChange={(e) =>
                    setExamForm({ ...examForm, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700">
                  Тип обследования
                </label>
                <button
                  type="button"
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                  className="mt-1 flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm"
                >
                  <span className={examForm.examinationType ? "text-gray-900" : "text-gray-500"}>
                    {examTypes?.find((t) => t.examinationType === examForm.examinationType)
                      ?.examinationTypeName || "Выберите тип"}
                  </span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {typeDropdownOpen && (
                  <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                    {examTypes?.map((t) => (
                      <li
                        key={t.examinationType}
                        onClick={() => {
                          setExamForm({ ...examForm, examinationType: t.examinationType });
                          setTypeDropdownOpen(false);
                        }}
                        className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-100 ${
                          examForm.examinationType === t.examinationType
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-900"
                        }`}
                      >
                        {t.examinationTypeName}
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  tabIndex={-1}
                  required
                  value={examForm.examinationType}
                  onChange={() => {}}
                  className="absolute inset-0 -z-10 opacity-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Описание
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) =>
                    setExamForm({ ...examForm, description: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setExamForm(emptyExamForm);
                    setShowCreateExam(false);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={createExamination.isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createExamination.isPending ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Examinations */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Обследования</h2>
          <button
            onClick={() => setShowCreateExam(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Назначить обследование
          </button>
        </div>

        {examsLoading && <p className="mt-4 text-gray-500">Загрузка...</p>}

        {examinations && examinations.length === 0 && (
          <p className="mt-4 text-gray-500">Обследований пока нет.</p>
        )}

        {examinations && examinations.length > 0 && (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-2 font-medium">Название</th>
                <th className="pb-2 font-medium">Тип</th>
                <th className="pb-2 font-medium">Дата</th>
                <th className="pb-2 font-medium">Статус</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {examinations.map((ex) => (
                <tr key={ex.id} className="border-b border-gray-100">
                  <td className="py-3">{ex.name}</td>
                  <td className="py-3">{examTypes?.find((t) => t.examinationType === ex.examinationType)?.examinationTypeName || ex.examinationType}</td>
                  <td className="py-3">
                    {new Date(ex.createdDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[ex.status] || ""}`}
                    >
                      {STATUS_LABELS[ex.status] || ex.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/patients/${patientId}/examinations/${ex.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Открыть
                      </Link>
                      <button
                        onClick={() => setDeleteExamTarget({ id: ex.id, name: ex.name })}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Decision Modal */}
      {deleteDecisionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Удалить решение? Привязанные обследования сохранятся и станут доступны для новых решений.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteDecisionTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmDeleteDecision}
                disabled={deleteDecision.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteDecision.isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Decision Modal */}
      {showCreateDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Новое решение</h2>
            <form onSubmit={handleCreateDecision} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Обследования пациента
                </label>
                {availableExamsForDecision.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Нет доступных обследований (все уже привязаны к решениям).
                  </p>
                ) : (
                  <ul className="mt-2 max-h-48 space-y-1 overflow-auto rounded-md border border-gray-200 p-2">
                    {availableExamsForDecision.map((ex) => (
                      <li key={ex.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={decisionForm.examinationIds.includes(ex.id)}
                            onChange={() => toggleDecisionExamination(ex.id)}
                          />
                          <span className="flex-1">{ex.name}</span>
                          <span className="text-xs text-gray-500">
                            {examTypes?.find((t) => t.examinationType === ex.examinationType)
                              ?.examinationTypeName || ex.examinationType}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Комментарий врача
                </label>
                <textarea
                  value={decisionForm.doctorComment}
                  onChange={(e) =>
                    setDecisionForm({ ...decisionForm, doctorComment: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDecisionForm({ examinationIds: [], doctorComment: "" });
                    setShowCreateDecision(false);
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={
                    createDecision.isPending || decisionForm.examinationIds.length === 0
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {createDecision.isPending ? "Создание..." : "Создать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decisions */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Решения</h2>
          <button
            onClick={() => setShowCreateDecision(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Создать решение
          </button>
        </div>

        {decisionsLoading && <p className="mt-4 text-gray-500">Загрузка...</p>}

        {decisions && decisions.length === 0 && (
          <p className="mt-4 text-gray-500">Решений пока нет.</p>
        )}

        {decisions && decisions.length > 0 && (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-2 font-medium">Дата</th>
                <th className="pb-2 font-medium">Обследований</th>
                <th className="pb-2 font-medium">Вероятность</th>
                <th className="pb-2 font-medium">Комментарий</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {decisions.map((d) => (
                <tr key={d.id} className="border-b border-gray-100">
                  <td className="py-3">
                    {new Date(d.createdDate).toLocaleDateString("ru-RU")}
                  </td>
                  <td className="py-3">{d.examinations.length}</td>
                  <td className="py-3">
                    {d.diseaseProbability != null
                      ? `${(d.diseaseProbability * 100).toFixed(1)}%`
                      : "—"}
                  </td>
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
                        onClick={() => setDeleteDecisionTarget({ id: d.id })}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
