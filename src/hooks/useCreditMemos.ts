/**
 * Credit Memo Hooks
 * 
 * TanStack Query hooks for Credit Memo data operations.
 * Follows the exact pattern from useInvoices.ts and useCustomerPayments.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { CreditMemo } from '../services/dataService';

/**
 * Fetch credit memos list with 3-tier cache
 */
export function useCreditMemos(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['creditMemos', companyId, filters],
    queryFn: () => dataService.getCreditMemos(companyId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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

/**
 * Fetch single credit memo by ID
 */
export function useCreditMemo(id: string) {
  return useQuery({
    queryKey: ['creditMemo', id],
    queryFn: () => dataService.getCreditMemoById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Create credit memo mutation
 */
export function useCreateCreditMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CreditMemo>) => dataService.createCreditMemo(data),
    onSuccess: () => {
      // Invalidate all credit memo list queries
      queryClient.invalidateQueries({ queryKey: ['creditMemos'] });
    },
  });
}

/**
 * Update credit memo mutation
 */
export function useUpdateCreditMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreditMemo> }) =>
      dataService.updateCreditMemo(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['creditMemos'] });
      queryClient.invalidateQueries({ queryKey: ['creditMemo', id] });
    },
  });
}

/**
 * Delete credit memo mutation
 */
export function useDeleteCreditMemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteCreditMemo(id),
    onSuccess: () => {
      // Invalidate all credit memo list queries
      queryClient.invalidateQueries({ queryKey: ['creditMemos'] });
    },
  });
}
