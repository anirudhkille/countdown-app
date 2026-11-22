import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { CardMenu } from '../../ui/CardMenu';
import { ProgressRing } from '../../ui/ProgressRing';
import { control, radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { remainingFraction } from '../../domain/progress';
import { resolveOccurrence } from '../../domain/recurrence';
import { deleteCountdown } from '../../data/countdownRepo';
import { cancelForCountdown } from '../notifications/notificationService';
import type { Countdown, Recurrence } from '../../domain/types';

const GRID_GAP = 12;
const TILE_PADDING = 14;

const RECURRENCE_LABEL: Record<Exclude<Recurrence, 'none'>, string> = {
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

export function formatTargetDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function recurrenceLabel(recurrence: Recurrence): string | null {
  return recurrence === 'none' ? null : RECURRENCE_LABEL[recurrence];
}

export function CountdownCard({
  countdown,
  now,
  onPress,
  onChanged,
  style,
  layout = 'grid',
}: {
  countdown: Countdown;
  now: number;
  onPress: () => void;
  onChanged?: () => void;
  style?: StyleProp<ViewStyle>;
  layout?: 'grid' | 'list';
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const ringSize = useMemo(() => {
    if (layout === 'list') return 64;
    const cardWidth = (width - spacing.md * 2 - GRID_GAP) / 2;
    return Math.max(84, Math.min(108, cardWidth - TILE_PADDING * 2 - 12));
  }, [layout, width]);

  const occurrence = useMemo(
    () => resolveOccurrence(countdown.targetDate, countdown.recurrence, now, countdown.anchorDay),
    [countdown, now]
  );

  const value = useMemo(
    () =>
      calculateCountdown({
        occurrence,
        now,
        direction: countdown.direction,
        unit: countdown.unit,
        anchorDay: countdown.anchorDay,
      }),
    [countdown, occurrence, now]
  );

  const title = countdown.title.trim();
  const date = formatTargetDate(occurrence);
  const repeat = recurrenceLabel(countdown.recurrence);
  const accent = countdown.color ?? theme.accent;
  const remaining = useMemo(
    () => remainingFraction(countdown, occurrence, now),
    [countdown, occurrence, now]
  );
  const suffix =
    countdown.direction === 'up' ? 'since' : value.isPast ? 'ago' : 'left';
  const accessibilityLabel = `${title || date}, ${value.value} ${value.unit} ${suffix}`;

  async function confirmDelete() {
    Alert.alert('Delete countdown?', `"${title || date}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelForCountdown(countdown.id);
          await deleteCountdown(countdown.id);
          onChanged?.();
        },
      },
    ]);
  }

  const menu = (
    <CardMenu
      visible={menuOpen}
      title={title || date}
      onClose={() => setMenuOpen(false)}
      actions={[
        { label: 'Edit', icon: 'create-outline', onPress: onPress },
        {
          label: 'Share',
          icon: 'share-social-outline',
          onPress: () => router.push(`/share/${countdown.id}`),
        },
        { label: 'Delete', icon: 'trash-outline', destructive: true, onPress: () => void confirmDelete() },
      ]}
    />
  );

  if (layout === 'list') {
    return (
      <>
        <View
          style={[
            style,
            { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
          ]}
        >
          <View style={styles.listRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              onPress={onPress}
              style={styles.listPress}
            >
              <ProgressRing
                value={value}
                direction={countdown.direction}
                size={ringSize}
                stroke={4}
                color={countdown.color}
                remaining={remaining}
              />
              <View style={styles.listText}>
                <Text numberOfLines={1} style={[typography.bodyStrong, { color: theme.text }]}>
                  {title || date}
                </Text>
                <Text numberOfLines={1} style={[typography.caption, { color: theme.textMuted }]}>
                  {title ? date : repeat ?? 'No title'}
                  {title && repeat ? `, ${repeat.toLowerCase()}` : ''}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Options for ${title || date}`}
              hitSlop={12}
              onPress={() => setMenuOpen(true)}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </View>
        {menu}
      </>
    );
  }

  return (
    <>
      <View style={style}>
        <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            style={styles.tilePress}
          >
            <View style={styles.tileTop}>
              <View style={styles.dateWrap}>
                {countdown.color ? (
                  <View style={[styles.colorDot, { backgroundColor: accent }]} />
                ) : null}
                <Text numberOfLines={1} style={[typography.caption, { color: theme.textMuted }]}>
                  {date}
                </Text>
              </View>
            </View>

            <View style={styles.tileDial}>
              <ProgressRing
                value={value}
                direction={countdown.direction}
                size={ringSize}
                stroke={Math.max(5, Math.round(ringSize * 0.075))}
                color={countdown.color}
                remaining={remaining}
              />
            </View>

            <View style={styles.tileFoot}>
              <Text numberOfLines={2} style={[typography.bodyStrong, { color: theme.text }]}>
                {title}
              </Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Options for ${title || date}`}
            hitSlop={12}
            onPress={() => setMenuOpen(true)}
            style={[styles.menuButton, styles.tileMenu]}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.textMuted} />
          </Pressable>
        </View>
      </View>
      {menu}
    </>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: TILE_PADDING,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
  },
  tilePress: { flex: 1 },
  tileMenu: { position: 'absolute', top: 2, right: 2 },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 44 },
  colorDot: { width: 6, height: 6, borderRadius: 3 },
  tileDial: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  tileFoot: { minHeight: 40, justifyContent: 'flex-end' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  listPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listText: { flex: 1, gap: 3 },
  menuButton: {
    width: control.tap,
    height: control.tap,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
