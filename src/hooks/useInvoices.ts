import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import type { Invoice } from '@/data/mockInvoices';
import { useMemo } from 'react';
import { MAX_RENDER_LIMIT } from '@/lib/constants';

export function useInvoices(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['invoices', companyId, filters],
    queryFn: () => dataService.getInvoices(companyId, filters),
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

export function useInvoiceById(id: string) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => dataService.getInvoiceById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Invoice>) => dataService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      dataService.updateInvoice(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}
