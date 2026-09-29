import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { listCountdowns } from '../../data/countdownRepo';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

const CHANNEL_ID = 'countdown-reminders';

const idFor = (countdownId: string) => `countdown:${countdownId}`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Countdown reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function scheduleForCountdown(countdown: Countdown): Promise<void> {
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
  await Notifications.cancelScheduledNotificationAsync(idFor(id));
}

export async function reconcileAll(): Promise<void> {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  const countdowns = await listCountdowns();
  for (const countdown of countdowns) {
    await scheduleForCountdown(countdown);
  }
}
