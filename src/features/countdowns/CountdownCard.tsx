import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { CardMenu } from '../../ui/CardMenu';
import { ProgressRing } from '../../ui/ProgressRing';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import { deleteCountdown } from '../../data/countdownRepo';
import { cancelForCountdown } from '../notifications/notificationService';
import type { Countdown } from '../../domain/types';

const CARD_PADDING = spacing.md;
const GRID_GAP = spacing.md;

function formatTargetDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function CountdownCard({
  countdown,
  now,
  onPress,
  style,
  layout = 'grid',
}: {
  countdown: Countdown;
  now: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  layout?: 'grid' | 'list';
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // The ring has to be derived from the card's real width. A fixed size overflows a
  // two-column card on a 360dp screen and leaves a gap inside a full-width one.
  const ringSize = useMemo(() => {
    if (layout === 'list') return Math.min(112, width * 0.28);
    const cardWidth = (width - spacing.md * 2 - GRID_GAP) / 2;
    return Math.max(88, Math.min(140, cardWidth - CARD_PADDING * 2));
  }, [layout, width]);

  const occurrence = useMemo(
    () => resolveOccurrence(countdown.targetDate, countdown.recurrence, now, countdown.anchorDay),
    [countdown, now]
  );

  const label = countdown.title.trim() || formatTargetDate(occurrence);

  async function confirmDelete() {
    Alert.alert('Delete countdown?', `"${label}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await cancelForCountdown(countdown.id);
          await deleteCountdown(countdown.id);
        },
      },
    ]);
  }

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

  if (layout === 'list') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${countdown.title}, ${value.value} ${value.unit}`}
        onPress={onPress}
        style={style}
      >
        <View style={[styles.listCard, { backgroundColor: theme.surface }]}>
          <ProgressRing
            value={value}
            direction={countdown.direction}
            size={ringSize}
            stroke={Math.round(ringSize * 0.09)}
          />
          <View style={styles.listText}>
            <Text numberOfLines={1} style={[typography.title, { color: theme.text }]}>
              {label}
            </Text>
            {countdown.title.trim() ? (
              <Text style={[typography.caption, { color: theme.textMuted }]}>
                {formatTargetDate(occurrence)}
                {countdown.recurrence !== 'none'
                  ? ` · ${countdown.recurrence.slice(0, -2)}ly`
                  : ''}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Options for ${label}`}
            hitSlop={10}
            onPress={() => setMenuOpen(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={theme.textMuted} />
          </Pressable>
        </View>

        <CardMenu
          visible={menuOpen}
          title={label}
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
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${countdown.title}, ${value.value} ${value.unit}`}
      onPress={onPress}
      style={style}
    >
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={[typography.body, { color: theme.textMuted }]}>
            {formatTargetDate(occurrence)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Options for ${label}`}
            hitSlop={10}
            onPress={() => setMenuOpen(true)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={theme.textMuted} />
          </Pressable>
        </View>
        <ProgressRing
          value={value}
          direction={countdown.direction}
          size={ringSize}
          stroke={Math.round(ringSize * 0.09)}
        />
      </View>

      <CardMenu
        visible={menuOpen}
        title={label}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: CARD_PADDING,
    alignItems: 'center',
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: CARD_PADDING,
  },
  listText: { flex: 1, gap: 2 },
});
