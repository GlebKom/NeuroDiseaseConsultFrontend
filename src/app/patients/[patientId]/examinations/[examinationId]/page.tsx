"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useExamination, useAvailableExaminationTypes } from "@/hooks/use-examinations";
import { usePatient } from "@/hooks/use-patients";
import {
  useRawDataFiles,
  useUploadRawDataFile,
  useDeleteRawDataFile,
  useDownloadRawDataFile,
} from "@/hooks/use-raw-data-files";

const STATUS_LABELS: Record<string, string> = {
  UPLOADED: "Загружено",
  PROCESSING: "В обработке",
  COMPLETED: "Завершено",
  FAILED: "Ошибка",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ExaminationDetailPage() {
  const { patientId, examinationId } = useParams<{
    patientId: string;
    examinationId: string;
  }>();
  const router = useRouter();
  const { data: examination, isLoading } = useExamination(examinationId);
  const { data: patient } = usePatient(patientId);
  const { data: examTypes } = useAvailableExaminationTypes();
  const { data: files, isLoading: filesLoading } =
    useRawDataFiles(examinationId);
  const uploadFile = useUploadRawDataFile();
  const deleteFile = useDeleteRawDataFile();
  const downloadFile = useDownloadRawDataFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile.mutate({ examinationId, file });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteFile.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  if (isLoading) return <p className="p-8 text-gray-500">Загрузка...</p>;
  if (!examination)
    return <p className="p-8 text-gray-500">Обследование не найдено.</p>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Назад
      </button>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">Подтверждение удаления</h2>
            <p className="mt-2 text-gray-600">
              Вы уверены, что хотите удалить файл{" "}
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
                disabled={deleteFile.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteFile.isPending ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold">{examination.name}</h1>
        {examination.description && (
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
            {examination.description}
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-gray-500">Пациент</dt>
            <dd>
              {patient ? (
                <Link
                  href={`/patients/${patientId}`}
                  className="text-blue-600 hover:underline"
                >
                  {patient.firstName} {patient.lastName}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Тип</dt>
            <dd>{examTypes?.find((t) => t.examinationType === examination.examinationType)?.examinationTypeName || examination.examinationType}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Дата создания</dt>
            <dd>
              {new Date(examination.createdDate).toLocaleDateString("ru-RU")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Статус</dt>
            <dd>{STATUS_LABELS[examination.status] || examination.status}</dd>
          </div>
        </dl>
      </div>

      {/* Files */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Файлы</h2>
          <label className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            {uploadFile.isPending ? "Загрузка..." : "Загрузить файл"}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              className="hidden"
              disabled={uploadFile.isPending}
            />
          </label>
        </div>

        {filesLoading && <p className="mt-4 text-gray-500">Загрузка...</p>}

        {files && files.length === 0 && (
          <p className="mt-4 text-gray-500">Файлов пока нет.</p>
        )}

        {files && files.length > 0 && (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-2 font-medium">Имя файла</th>
                <th className="pb-2 font-medium">Формат</th>
                <th className="pb-2 font-medium">Размер</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id} className="border-b border-gray-100">
                  <td className="py-3">{f.originalFilename}</td>
                  <td className="py-3">{f.fileFormat}</td>
                  <td className="py-3">{formatFileSize(f.fileSize)}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() =>
                          downloadFile.mutate({
                            id: f.id,
                            fileName: f.originalFilename,
                          })
                        }
                        disabled={downloadFile.isPending}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Скачать
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: f.id, name: f.originalFilename })}
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
