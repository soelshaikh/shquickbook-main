/**
 * Deposit Hooks
 * 
 * TanStack Query hooks for Deposit data operations.
 * Follows the exact pattern from useInvoices.ts and useCustomerPayments.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { Deposit } from '../services/dataService';

/**
 * Fetch deposits list with 3-tier cache
 */
export function useDeposits(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['deposits', companyId, filters],
    queryFn: () => dataService.getDeposits(companyId, filters),
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
 * Fetch single deposit by ID
 */
export function useDeposit(id: string) {
  return useQuery({
    queryKey: ['deposit', id],
    queryFn: () => dataService.getDepositById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Create deposit mutation
 */
export function useCreateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Deposit>) => dataService.createDeposit(data),
    onSuccess: () => {
      // Invalidate all deposit list queries
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}

/**
 * Update deposit mutation
 */
export function useUpdateDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deposit> }) =>
      dataService.updateDeposit(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['deposit', id] });
    },
  });
}

/**
 * Delete deposit mutation
 */
export function useDeleteDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteDeposit(id),
    onSuccess: () => {
      // Invalidate all deposit list queries
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
    },
  });
}
