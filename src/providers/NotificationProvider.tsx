import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { notificationService } from '@/src/services/notificationService';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, session } = useAuth();
  const didInitialSetup = useRef(false);

  useEffect(() => {
    if (!session || !user) {
      didInitialSetup.current = false;
      return;
    }

    if (didInitialSetup.current) return;
    didInitialSetup.current = true;

    const setup = async () => {
      await notificationService.requestPermissions();
      await notificationService.refreshAll(user.id, profile?.currency ?? 'MXN', { force: true });
    };
    setup();
  }, [session, user?.id, profile?.currency]);

  useEffect(() => {
    if (!user) return;

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Debounce interno en refreshAll — no fuerza, no duplica
        notificationService.refreshAll(user.id, profile?.currency ?? 'MXN');
      }
    });

    return () => sub.remove();
  }, [user?.id, profile?.currency]);

  return <>{children}</>;
}
