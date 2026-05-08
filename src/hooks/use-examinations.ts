import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, buildPageQuery } from "@/lib/api-client";
import type {
  Examination,
  Page,
  PageParams,
  CreateExaminationRequest,
  UpdateExaminationRequest,
  AvailableExaminationType,
} from "@/types";

const EXAMINATIONS_KEY = ["examinations"];

export function useExaminations(params: PageParams, filters?: Record<string, string>) {
  return useQuery({
    queryKey: [...EXAMINATIONS_KEY, params, filters],
    queryFn: () =>
      api.get<Page<Examination>>(
        `/examinations?${buildPageQuery(params, filters)}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function usePatientExaminations(patientId: string, params: PageParams) {
  return useQuery({
    queryKey: [...EXAMINATIONS_KEY, "patient", patientId, params],
    queryFn: async () => {
      const page = await api.get<Page<Examination>>(
        `/examinations?${buildPageQuery({ ...params, size: 1000 })}`
      );
      const filtered = page.content.filter((e) => e.patientId === patientId);
      return filtered;
    },
    enabled: !!patientId,
  });
}

export function useExamination(id: string) {
  return useQuery({
    queryKey: [...EXAMINATIONS_KEY, id],
    queryFn: () => api.get<Examination>(`/examinations/${id}`),
    enabled: !!id,
  });
}

export function useAvailableExaminationTypes() {
  return useQuery({
    queryKey: ["availableExaminationTypes"],
    queryFn: () =>
      api.get<AvailableExaminationType[]>(
        "/examinations/availableExaminations"
      ),
    staleTime: Infinity,
  });
}

export function useCreateExamination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExaminationRequest) =>
      api.post<Examination>("/examinations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXAMINATIONS_KEY }),
  });
}

export function useUpdateExamination(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateExaminationRequest) =>
      api.put<Examination>(`/examinations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXAMINATIONS_KEY }),
  });
}

export function useDeleteExamination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/examinations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXAMINATIONS_KEY }),
  });
}
