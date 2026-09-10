import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { categoryRepository } from '@/src/data/repositories/categoryRepository';
import { categoryService } from '@/src/services/transactionService';
import type { CategoryInput } from '@/src/core/validation/schemas';

export function useCategories(type?: 'income' | 'expense') {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.categories, type],
    queryFn: () =>
      type ? categoryRepository.getByType(user!.id, type) : categoryRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useCreateCategory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => categoryService.create(user!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      categoryService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useDeleteCategory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.softDelete(id, user!.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.categories });
      await qc.invalidateQueries({ queryKey: queryKeys.budgets() });
      await qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
