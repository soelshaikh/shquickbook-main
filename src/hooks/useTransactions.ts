import { useQuery } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';

export function useTransactions(companyId: string, filters?: any) {
  return useQuery({
    queryKey: ['transactions', companyId, filters],
    queryFn: () => dataService.getTransactions(companyId, filters),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
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
