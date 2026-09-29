import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  ensureChannel,
  ensurePermissions,
  notificationsBlocked,
  onNotificationResponse,
  reconcileAll,
} from './notificationService';

export function useNotificationBootstrap(): void {
  useEffect(() => {
    if (notificationsBlocked()) return;

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

    const responseSub = onNotificationResponse(() => {});

    return () => {
      cancelled = true;
      sub.remove();
      responseSub.remove();
    };
  }, []);
}
