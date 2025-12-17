/**
 * Customer Payment Hooks
 * 
 * TanStack Query hooks for Customer Payment data operations.
 * Follows the exact pattern from useInvoices.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { CustomerPayment } from '../services/dataService';

/**
 * Fetch customer payments list with 3-tier cache
 */
export function useCustomerPayments(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['customerPayments', companyId, filters],
    queryFn: () => dataService.getCustomerPayments(companyId, filters),
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
 * Fetch single customer payment by ID
 */
export function useCustomerPayment(id: string) {
  return useQuery({
    queryKey: ['customerPayment', id],
    queryFn: () => dataService.getCustomerPaymentById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Create customer payment mutation
 */
export function useCreateCustomerPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<CustomerPayment>) => dataService.createCustomerPayment(data),
    onSuccess: () => {
      // Invalidate all customer payment list queries
      queryClient.invalidateQueries({ queryKey: ['customerPayments'] });
    },
  });
}

/**
 * Update customer payment mutation
 */
export function useUpdateCustomerPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerPayment> }) =>
      dataService.updateCustomerPayment(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['customerPayments'] });
      queryClient.invalidateQueries({ queryKey: ['customerPayment', id] });
    },
  });
}

/**
 * Delete customer payment mutation
 */
export function useDeleteCustomerPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteCustomerPayment(id),
    onSuccess: () => {
      // Invalidate all customer payment list queries
      queryClient.invalidateQueries({ queryKey: ['customerPayments'] });
    },
  });
}
