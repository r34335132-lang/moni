import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/providers/AuthProvider';
import { queryKeys } from '@/src/core/constants/queryKeys';
import { dashboardService } from '@/src/services/dashboardService';
import { bankConnectionRepository } from '@/src/data/repositories/bankConnectionRepository';
import { notificationRepository } from '@/src/data/repositories/notificationRepository';
import { subscriptionRepository } from '@/src/data/repositories/notificationRepository';

export function useDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => dashboardService.getStats(user!.id),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useBankConnections() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.bankConnections,
    queryFn: () => bankConnectionRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationRepository.getAll(user!.id),
    enabled: !!user,
  });
}

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.subscription,
    queryFn: () => subscriptionRepository.getActive(user!.id),
    enabled: !!user,
  });
}
