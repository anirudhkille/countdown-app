import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ensureChannel, ensurePermissions, reconcileAll } from './notificationService';

export function useNotificationBootstrap(): void {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await ensureChannel();
      await ensurePermissions();
      if (cancelled) return;
      await reconcileAll();
    })();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reconcileAll();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {});

    return () => {
      cancelled = true;
      sub.remove();
      responseSub.remove();
    };
  }, []);
}
