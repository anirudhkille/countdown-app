import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCountdowns } from '../../features/countdowns/useCountdowns';
import { useNow } from '../../features/countdowns/useNow';
import { CountdownCard } from '../../features/countdowns/CountdownCard';
import { ViewToggle } from '../../features/countdowns/ViewToggle';
import { EmptyState } from '../../ui/EmptyState';
import { getViewMode, setViewMode, type ViewMode } from '../../data/settings';
import { radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

export default function CountdownsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { countdowns, loading, reload } = useCountdowns();
  const now = useNow();
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');

  useEffect(() => {
    void getViewMode().then(setViewModeState);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[typography.title, { color: theme.text }]}>Countdowns</Text>
        <View style={styles.headerActions}>
          <ViewToggle theme={theme} value={viewMode} onChange={changeView} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Import from calendar"
            onPress={() => router.push('/import')}
            style={[styles.icon, { backgroundColor: theme.surfaceAlt }]}
          >
            <Ionicons name="download-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add countdown"
            onPress={() => router.push('/countdown/new')}
            style={[styles.icon, { backgroundColor: theme.accent }]}
          >
            <Ionicons name="add" size={26} color={theme.accentText} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={sorted}
        key={viewMode}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.column : undefined}
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
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/countdown/${item.id}`);
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  column: { gap: spacing.md },
  // flexGrow lets the empty state centre vertically instead of hugging the top.
  list: {
    flexGrow: 1,
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
