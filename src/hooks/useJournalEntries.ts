import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataService } from '@/services/dataService';
import type { JournalEntry } from '@/data/mockJournalEntries';
import { useMemo } from 'react';
import { MAX_RENDER_LIMIT } from '@/lib/constants';

export function useJournalEntries(companyId: string, filters?: any) {
  const query = useQuery({
    queryKey: ['journalEntries', companyId, filters],
    queryFn: () => dataService.getJournalEntries(companyId, filters),
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

export function useJournalEntryById(id: string) {
  return useQuery({
    queryKey: ['journalEntry', id],
    queryFn: () => dataService.getJournalEntryById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<JournalEntry>) => dataService.createJournalEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JournalEntry> }) =>
      dataService.updateJournalEntry(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntry', id] });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dataService.deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}
