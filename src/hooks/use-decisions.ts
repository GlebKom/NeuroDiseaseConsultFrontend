import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api, buildPageQuery } from "@/lib/api-client";
import type {
  Decision,
  DecisionSummary,
  Page,
  PageParams,
  CreateDecisionRequest,
  UpdateDecisionRequest,
} from "@/types";

const DECISIONS_KEY = ["decisions"];

export function useDecisions(params: PageParams, filters?: Record<string, string>) {
  return useQuery({
    queryKey: [...DECISIONS_KEY, params, filters],
    queryFn: () =>
      api.get<Page<DecisionSummary>>(
        `/decisions?${buildPageQuery(params, filters)}`
      ),
    placeholderData: keepPreviousData,
  });
}

export function useDecision(id: string) {
  return useQuery({
    queryKey: [...DECISIONS_KEY, id],
    queryFn: () => api.get<Decision>(`/decisions/${id}`),
    enabled: !!id,
  });
}

export function useCreateDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDecisionRequest) =>
      api.post<Decision>("/decisions", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECISIONS_KEY }),
  });
}

export function useUpdateDecision(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateDecisionRequest) =>
      api.put<Decision>(`/decisions/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECISIONS_KEY }),
  });
}

export function useDeleteDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/decisions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECISIONS_KEY }),
  });
}