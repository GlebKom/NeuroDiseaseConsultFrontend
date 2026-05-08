import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, uploadFile, downloadFile } from "@/lib/api-client";
import type { RawDataFile } from "@/types";

const FILES_KEY = ["raw-data-files"];

export function useRawDataFiles(examinationId: string) {
  return useQuery({
    queryKey: [...FILES_KEY, examinationId],
    queryFn: () =>
      api.get<RawDataFile[]>(`/raw-data-files?examinationId=${examinationId}`),
    enabled: !!examinationId,
  });
}

export function useUploadRawDataFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examinationId,
      file,
    }: {
      examinationId: string;
      file: File;
    }) =>
      uploadFile("/raw-data-files", file, { examinationId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_KEY }),
  });
}

export function useDeleteRawDataFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/raw-data-files/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: FILES_KEY }),
  });
}

export function useDownloadRawDataFile() {
  return useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName: string }) =>
      downloadFile(`/raw-data-files/${id}/download`, fileName),
  });
}
