/**
 * Vendor Payment Hooks
 * 
 * TanStack Query hooks for Vendor Payment data operations.
 * Follows the exact pattern from useInvoices.ts and useCustomerPayments.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '../services/dataService';
import type { VendorPayment } from '../services/dataService';

/**
 * Fetch vendor payments list with 3-tier cache
 */
export function useVendorPayments(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['vendorPayments', companyId, filters],
    queryFn: () => dataService.getVendorPayments(companyId, filters),
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
 * Fetch single vendor payment by ID
 */
export function useVendorPayment(id: string) {
  return useQuery({
    queryKey: ['vendorPayment', id],
    queryFn: () => dataService.getVendorPaymentById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

/**
 * Create vendor payment mutation
 */
export function useCreateVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<VendorPayment>) => dataService.createVendorPayment(data),
    onSuccess: () => {
      // Invalidate all vendor payment list queries
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
    },
  });
}

/**
 * Update vendor payment mutation
 */
export function useUpdateVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorPayment> }) =>
      dataService.updateVendorPayment(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorPayment', id] });
    },
  });
}

/**
 * Delete vendor payment mutation
 */
export function useDeleteVendorPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteVendorPayment(id),
    onSuccess: () => {
      // Invalidate all vendor payment list queries
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
    },
  });
}
