"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useDecision,
  useUpdateDecision,
  useDeleteDecision,
} from "@/hooks/use-decisions";
import { usePatient } from "@/hooks/use-patients";
import {
  usePatientExaminations,
  useAvailableExaminationTypes,
} from "@/hooks/use-examinations";
import type { SaccadeVelocityChart } from "@/types";

export default function DecisionDetailPage() {
  const { decisionId } = useParams<{ decisionId: string }>();
  const router = useRouter();
  const { data: decision, isLoading } = useDecision(decisionId);
  const { data: patient } = usePatient(decision?.patientId || "");
  const { data: patientExams } = usePatientExaminations(
    decision?.patientId || "",
    { page: 0, size: 1000, sort: "createdDate,desc" }
  );
  const { data: examTypes } = useAvailableExaminationTypes();
  const updateDecision = useUpdateDecision(decisionId);
  const deleteDecision = useDeleteDecision();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ examinationIds: string[]; doctorComment: string }>({
    examinationIds: [],
    doctorComment: "",
  });
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (decision && !editing) {
      setForm({
        examinationIds: decision.examinations.map((e) => e.id),
        doctorComment: decision.doctorComment || "",
      });
    }
  }, [decision, editing]);

  const linkedElsewhere = useMemo(() => {
    if (!patientExams || !decision) return new Set<string>();
    const currentIds = new Set(decision.examinations.map((e) => e.id));
    return new Set(
      patientExams
        .filter((e) => e.decisionId && e.decisionId !== decisionId && !currentIds.has(e.id))
        .map((e) => e.id)
    );
  }, [patientExams, decision, decisionId]);

  const toggleExam = (id: string) => {
    setForm((prev) => ({
      ...prev,
      examinationIds: prev.examinationIds.includes(id)
        ? prev.examinationIds.filter((x) => x !== id)
        : [...prev.examinationIds, id],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDecision.mutate(form, {
      onSuccess: () => setEditing(false),
    });
  };

  const confirmDelete = () => {
    deleteDecision.mutate(decisionId, {
      onSuccess: () => router.push("/decisions"),
    });
  };

  if (isLoading) return <p className="p-8 text-gray-500">Загрузка...</p>;
  if (!decision) return <p className="p-8 text-gray-500">Решение не найдено.</p>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Назад
      </button>

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Удалить решение? Привязанные обследования сохранятся и станут доступны для новых решений.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDelete(false)}
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

      <div className="mt-4 rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Решение</h1>
            {patient && (
              <p className="mt-1 text-sm text-gray-600">
                Пациент:{" "}
                <Link
                  href={`/patients/${decision.patientId}`}
                  className="text-blue-600 hover:underline"
                >
                  {patient.firstName} {patient.lastName}
                </Link>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
              >
                Редактировать
              </button>
            )}
            <button
              onClick={() => setShowDelete(true)}
              className="rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100"
            >
              Удалить
            </button>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Создано</dt>
            <dd>{new Date(decision.createdDate).toLocaleString("ru-RU")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Обновлено</dt>
            <dd>{new Date(decision.updatedDate).toLocaleString("ru-RU")}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Вероятность заболевания</dt>
            <dd className="font-semibold">
              {decision.diseaseProbability != null
                ? `${(decision.diseaseProbability * 100).toFixed(1)}%`
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {!editing ? (
        <>
          <div className="mt-6 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Комментарий врача</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {decision.doctorComment || "—"}
            </p>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Привязанные обследования</h2>
            {decision.examinations.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Нет привязанных обследований.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {decision.examinations.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{e.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {examTypes?.find((t) => t.examinationType === e.examinationType)
                          ?.examinationTypeName || e.examinationType}
                      </span>
                    </div>
                    <Link
                      href={`/patients/${decision.patientId}/examinations/${e.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Открыть
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {decision.saccadeVelocity && (
            <div className="mt-6 rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold">Скорость саккад</h2>
              <SaccadeVelocityChartView data={decision.saccadeVelocity} />
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">Обследования</h2>
            {!patientExams || patientExams.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Нет обследований пациента.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {patientExams.map((ex) => {
                  const disabled = linkedElsewhere.has(ex.id);
                  return (
                    <li key={ex.id}>
                      <label
                        className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
                          disabled ? "opacity-50" : "cursor-pointer hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={form.examinationIds.includes(ex.id)}
                          onChange={() => toggleExam(ex.id)}
                        />
                        <span className="flex-1">{ex.name}</span>
                        <span className="text-xs text-gray-500">
                          {examTypes?.find((t) => t.examinationType === ex.examinationType)
                            ?.examinationTypeName || ex.examinationType}
                        </span>
                        {disabled && (
                          <span className="text-xs text-gray-400">
                            в другом решении
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700">
              Комментарий врача
            </label>
            <textarea
              value={form.doctorComment}
              onChange={(e) => setForm({ ...form, doctorComment: e.target.value })}
              rows={5}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateDecision.isPending || form.examinationIds.length === 0}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateDecision.isPending ? "Сохранение..." : "Сохранить"}
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
    </main>
  );
}

function SaccadeVelocityChartView({ data }: { data: SaccadeVelocityChart }) {
  const { time, velocity } = data;
  if (!time?.length || !velocity?.length || time.length !== velocity.length) {
    return <p className="mt-2 text-sm text-gray-500">Нет данных для графика.</p>;
  }

  const width = 720;
  const height = 240;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 32;

  const tMin = time[0];
  const tMax = time[time.length - 1];
  const vMin = Math.min(...velocity);
  const vMax = Math.max(...velocity);
  const tRange = tMax - tMin || 1;
  const vRange = vMax - vMin || 1;

  const x = (t: number) => padL + ((t - tMin) / tRange) * (width - padL - padR);
  const y = (v: number) => padT + (1 - (v - vMin) / vRange) * (height - padT - padB);

  const points = time.map((t, i) => `${x(t)},${y(velocity[i])}`).join(" ");

  const yTicks = 4;
  const xTicks = 5;

  return (
    <div className="mt-3 overflow-x-auto">
      <svg width={width} height={height} className="text-gray-400">
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const v = vMin + (vRange * i) / yTicks;
          const yy = y(v);
          return (
            <g key={`y${i}`}>
              <line x1={padL} x2={width - padR} y1={yy} y2={yy} stroke="currentColor" strokeWidth={0.5} />
              <text x={padL - 6} y={yy + 3} textAnchor="end" fontSize="10" fill="currentColor">
                {v.toFixed(1)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: xTicks + 1 }).map((_, i) => {
          const t = tMin + (tRange * i) / xTicks;
          const xx = x(t);
          return (
            <text key={`x${i}`} x={xx} y={height - padB + 14} textAnchor="middle" fontSize="10" fill="currentColor">
              {t.toFixed(2)}
            </text>
          );
        })}
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth={1.5} />
        <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="11" fill="currentColor">
          Время, с
        </text>
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          fontSize="11"
          fill="currentColor"
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Скорость
        </text>
      </svg>
    </div>
  );
}