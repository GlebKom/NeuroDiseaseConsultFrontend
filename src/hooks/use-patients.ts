import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, buildPageQuery } from "@/lib/api-client";
import type { Patient, Page, PageParams, CreatePatientRequest, UpdatePatientRequest } from "@/types";

const PATIENTS_KEY = ["patients"];

export function usePatients(params: PageParams, filters?: Record<string, string>) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, params, filters],
    queryFn: () =>
      api.get<Page<Patient>>(`/patients?${buildPageQuery(params, filters)}`),
    placeholderData: keepPreviousData,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [...PATIENTS_KEY, id],
    queryFn: () => api.get<Patient>(`/patients/${id}`),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePatientRequest) =>
      api.post<Patient>("/patients", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePatientRequest) =>
      api.put<Patient>(`/patients/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/patients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PATIENTS_KEY }),
  });
}
