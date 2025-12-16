import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import type { Bill } from '@/data/mockBills';
import { useMemo } from 'react';
import { MAX_RENDER_LIMIT } from '@/lib/constants';

export function useBills(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['bills', companyId, filters],
    queryFn: () => dataService.getBills(companyId, filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Return full dataset - let the page apply filters first, then limit
  // This ensures filters search the entire dataset, not just the first 1k
  return {
    ...query,
    data: query.data || [],
    // Expose full count for warning banner
    totalCount: query.data?.length ?? 0,
  };
}

export function useBillById(id: string) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => dataService.getBillById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Bill>) => dataService.createBill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Bill> }) =>
      dataService.updateBill(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['bill', id] });
    },
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });
}
