import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import { useMemo } from 'react';
import { MAX_RENDER_LIMIT } from '@/lib/constants';

export function useTransactions(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['transactions', companyId, filters],
    queryFn: () => dataService.getTransactions(companyId, filters),
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

export function useTransactionById(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => dataService.getTransactionById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}
