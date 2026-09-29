import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCountdowns } from '../../features/countdowns/useCountdowns';
import { useNow } from '../../features/countdowns/useNow';
import { CountdownCard } from '../../features/countdowns/CountdownCard';
import { EmptyState } from '../../ui/EmptyState';
import { getViewMode as loadViewMode, setViewMode, type ViewMode } from '../../data/settings';
import { radius, spacing } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

export default function CountdownsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { countdowns, loading, reload } = useCountdowns();
  const now = useNow();
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    void loadViewMode().then(setViewModeState);
  }, []);

  const changeView = useCallback(async (next: ViewMode) => {
    setViewModeState(next);
    await setViewMode(next);
  }, []);

  const sorted = useMemo(() => {
    return [...countdowns].sort((a, b) => {
      const valueOf = (c: Countdown) => {
        const occurrence = resolveOccurrence(c.targetDate, c.recurrence, now, c.anchorDay);
        return calculateCountdown({
          occurrence,
          now,
          direction: c.direction,
          unit: 'days',
          anchorDay: c.anchorDay,
        }).totalDays;
      };
      return valueOf(a) - valueOf(b);
    });
  }, [countdowns, now]);

  const headerActions = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Switch between grid and list"
      hitSlop={8}
      onPress={() => void changeView(viewMode === 'grid' ? 'list' : 'grid')}
      style={styles.headerButton}
    >
      <Ionicons
        name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'}
        size={22}
        color={theme.text}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          title: 'Countdown',
          headerRight: headerActions,
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              hitSlop={8}
              onPress={() => router.push('/settings')}
              style={styles.headerButton}
            >
              <Ionicons name="menu" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
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
          loading ? null : (
            <EmptyState
              theme={theme}
              title="No countdowns yet"
              message="Tap + to add a birthday, a holiday, or anything you're looking forward to."
            />
          )
        }
        renderItem={({ item }) => (
          <CountdownCard
            countdown={item}
            now={now}
            style={viewMode === 'grid' ? styles.gridItem : styles.listItem}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/countdown/${item.id}`);
            }}
          />
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add countdown"
        onPress={() => router.push('/countdown/new')}
        style={[styles.fab, { backgroundColor: theme.accent }]}
      >
        <Ionicons name="add" size={30} color={theme.accentText} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  gridItem: { flex: 1 },
  listItem: { flex: 1 },
  gridRow: { columnGap: spacing.md },
  list: {
    flexGrow: 1,
    padding: spacing.md,
    rowGap: spacing.md,
    // Clears the floating action button.
    paddingBottom: spacing.xl * 3,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
