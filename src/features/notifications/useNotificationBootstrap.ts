import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import {
  ensureChannel,
  ensurePermissions,
  lastNotificationCountdownId,
  notificationsBlocked,
  onNotificationResponse,
  reconcileAll,
} from './notificationService';

export function useNotificationBootstrap(): void {
  const router = useRouter();
  const navigationState = useRootNavigationState();

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

    const responseSub = onNotificationResponse((countdownId) => {
      router.push(`/countdown/${countdownId}`);
    });

    return () => {
      cancelled = true;
      sub.remove();
      responseSub.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!navigationState?.key || notificationsBlocked()) return;
    const countdownId = lastNotificationCountdownId();
    if (countdownId) router.push(`/countdown/${countdownId}`);
  }, [navigationState?.key, router]);
}
