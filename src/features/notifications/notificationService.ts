import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import type * as ExpoNotifications from 'expo-notifications';
import { listCountdowns } from '../../data/countdownRepo';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

const CHANNEL_ID = 'countdown-reminders';

const idFor = (countdownId: string) => `countdown:${countdownId}`;

export function notificationsBlocked(): boolean {
  return isRunningInExpoGo() && Platform.OS === 'android';
}

let cached: typeof ExpoNotifications | null | undefined;
let handlerInstalled = false;

function getNotifications(): typeof ExpoNotifications | null {
  if (cached !== undefined) return cached;
  if (notificationsBlocked()) {
    cached = null;
    return cached;
  }
  try {
    cached = require('expo-notifications') as typeof ExpoNotifications;
    if (!handlerInstalled) {
      handlerInstalled = true;
      cached.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
    }
  } catch {
    cached = null;
  }
  return cached;
}

export async function ensurePermissions(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function ensureChannel(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Countdown reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function scheduleForCountdown(countdown: Countdown): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;

  await cancelForCountdown(countdown.id);
  if (countdown.remindAt === null) return;
  if (countdown.archived) return;

  const now = Date.now();
  const occurrence = resolveOccurrence(
    countdown.targetDate,
    countdown.recurrence,
    now,
    countdown.anchorDay
  );
  const fireAt = countdown.remindAt + (occurrence - countdown.targetDate);
  if (fireAt <= now) return;

  const granted = await ensurePermissions();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: idFor(countdown.id),
    content: {
      title: countdown.title,
      body:
        countdown.recurrence === 'none'
          ? 'Your countdown is today.'
          : 'Your countdown is coming up.',
      data: { countdownId: countdown.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(fireAt),
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelForCountdown(id: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(idFor(id));
}

export async function reconcileAll(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const countdowns = await listCountdowns();
  for (const countdown of countdowns) {
    await scheduleForCountdown(countdown);
  }
}

export function onNotificationResponse(
  handler: (countdownId: string) => void
): { remove: () => void } {
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const id = response.notification.request.content.data?.countdownId;
    if (typeof id === 'string') handler(id);
  });
}
