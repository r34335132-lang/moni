import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type LocalReminder } from '@/src/services/notificationService';
import { useAuth } from '@/src/providers/AuthProvider';

const REMINDERS_KEY = ['local-reminders'] as const;

export function useReminders() {
  return useQuery({
    queryKey: REMINDERS_KEY,
    queryFn: () => notificationService.getReminders(),
  });
}

export function useAddReminder() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<LocalReminder, 'id' | 'notificationId'>) =>
      notificationService.addReminder(input),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
      if (user) await notificationService.refreshAll(user.id, profile?.currency ?? 'MXN', { force: true });
    },
  });
}

export function useUpdateReminder() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<LocalReminder> }) =>
      notificationService.updateReminder(id, patch),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
      if (user) await notificationService.refreshAll(user.id, profile?.currency ?? 'MXN', { force: true });
    },
  });
}

export function useDeleteReminder() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteReminder(id),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
      if (user) await notificationService.refreshAll(user.id, profile?.currency ?? 'MXN', { force: true });
    },
  });
}

export function useSendDailySummary() {
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: () => notificationService.sendInstantSummary(user!.id, profile?.currency ?? 'MXN'),
  });
}
