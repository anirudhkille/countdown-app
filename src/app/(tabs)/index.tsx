import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCountdowns } from '../../features/countdowns/useCountdowns';
import { useNow } from '../../features/countdowns/useNow';
import { CountdownCard } from '../../features/countdowns/CountdownCard';
import { EmptyState } from '../../ui/EmptyState';
import { ScreenHeader } from '../../ui/ScreenHeader';
import { getViewMode as loadViewMode, setViewMode, type ViewMode } from '../../data/settings';
import { control, radius, spacing } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

const GRID_GAP = 12;

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.toggle, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {(['grid', 'list'] as const).map((option) => {
        const active = mode === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityLabel={option === 'grid' ? 'Grid view' : 'List view'}
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[
              styles.toggleItem,
              active ? { backgroundColor: theme.surface } : null,
            ]}
          >
            <Ionicons
              name={option === 'grid' ? 'grid-outline' : 'list-outline'}
              size={17}
              color={active ? theme.text : theme.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function CountdownsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { countdowns, loading, error, reload } = useCountdowns();
  const now = useNow();
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    void loadViewMode().then(setViewModeState);
  }, []);

  const changeView = useCallback(async (next: ViewMode) => {
    setViewModeState(next);
    await setViewMode(next);
  }, []);

  const { sorted, nextDays } = useMemo(() => {
    const rows = countdowns.map((countdown) => {
      const occurrence = resolveOccurrence(
        countdown.targetDate,
        countdown.recurrence,
        now,
        countdown.anchorDay
      );
      const result = calculateCountdown({
        occurrence,
        now,
        direction: countdown.direction,
        unit: 'days',
        anchorDay: countdown.anchorDay,
      });
      return {
        countdown,
        days: result.totalDays,
        stale: countdown.direction === 'down' && result.isPast,
      };
    });
    rows.sort((a, b) => {
      if (a.stale !== b.stale) return a.stale ? 1 : -1;
      return a.days - b.days;
    });
    const next = rows.find((row) => !row.stale && row.countdown.direction === 'down');
    return {
      sorted: rows.map((row) => row.countdown) as Countdown[],
      nextDays: next?.days ?? null,
    };
  }, [countdowns, now]);

  const summary = useMemo(() => {
    if (loading) return 'Reading your dates';
    if (error) return 'Your dates are out of reach';
    const count = countdowns.length;
    if (count === 0) return 'Dates worth waiting for';
    const base = `${count} countdown${count === 1 ? '' : 's'}`;
    if (nextDays === null) return base;
    if (nextDays <= 0) return `${base}. One lands today.`;
    if (nextDays === 1) return `${base}. Next tomorrow.`;
    return `${base}. Next in ${nextDays} days.`;
  }, [countdowns.length, error, loading, nextDays]);

  const gridItemWidth = (width - control.gutter * 2 - GRID_GAP) / 2;

  return (
    <View style={styles.container}>
      <Tabs.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Countdown"
        subtitle={summary}
        actions={<ViewToggle mode={viewMode} onChange={(next) => void changeView(next)} />}
      />

      <FlatList
        data={sorted}
        key={viewMode}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        onRefresh={() => void reload()}
        refreshing={loading}
        ListEmptyComponent={
          loading ? null : error ? (
            <EmptyState
              theme={theme}
              title="Your countdowns could not be read"
              message="The local database did not answer. Try again."
              actionLabel="Try again"
              onAction={() => void reload()}
            />
          ) : (
            <EmptyState
              theme={theme}
              title="No countdowns yet"
              message="Add a birthday, a trip, or a deadline to get started."
              actionLabel="Add your first countdown"
              onAction={() => router.push('/countdown/new')}
            />
          )
        }
        renderItem={({ item }) => (
          <CountdownCard
            countdown={item}
            now={now}
            layout={viewMode}
            style={viewMode === 'grid' ? [styles.gridItem, { maxWidth: gridItemWidth }] : styles.listItem}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/countdown/${item.id}`);
            }}
            onChanged={() => void reload()}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add countdown"
        onPress={() => {
          void Haptics.selectionAsync();
          router.push('/countdown/new');
        }}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Ionicons name="add" size={28} color={theme.accentText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toggleItem: {
    width: 36,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridItem: { flex: 1 },
  listItem: { flex: 1 },
  gridRow: { columnGap: GRID_GAP },
  list: {
    flexGrow: 1,
    paddingHorizontal: control.gutter,
    paddingTop: spacing.xs,
    rowGap: GRID_GAP,
    paddingBottom: 120,
  },
  fab: {
    position: 'absolute',
    right: control.gutter,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
