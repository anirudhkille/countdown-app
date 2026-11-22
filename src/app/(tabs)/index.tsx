import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useCountdowns } from '../../features/countdowns/useCountdowns';
import { useNow } from '../../features/countdowns/useNow';
import { CountdownCard, formatTargetDate } from '../../features/countdowns/CountdownCard';
import { scheduleForCountdown } from '../../features/notifications/notificationService';
import { insertCountdown } from '../../data/countdownRepo';
import { EmptyState } from '../../ui/EmptyState';
import { OptionPicker } from '../../ui/OptionPicker';
import { ScreenHeader } from '../../ui/ScreenHeader';
import {
  getSortKey,
  getViewMode as loadViewMode,
  setSortKey,
  setViewMode,
  type SortKey,
  type ViewMode,
} from '../../data/settings';
import { control, radius, spacing, typography } from '../../ui/tokens';
import { useTheme } from '../../ui/ThemeProvider';
import { calculateCountdown } from '../../domain/countdown';
import { resolveOccurrence } from '../../domain/recurrence';
import type { Countdown } from '../../domain/types';

const GRID_GAP = 12;

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'next', label: 'Next date' },
  { value: 'newest', label: 'Recently added' },
  { value: 'name', label: 'Name' },
];

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

interface Row {
  countdown: Countdown;
  days: number;
  stale: boolean;
  created: number;
}

export default function CountdownsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [showArchived, setShowArchived] = useState(false);
  const { countdowns, loading, error, reload } = useCountdowns(showArchived);
  const now = useNow();
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [sortKey, setSortKeyState] = useState<SortKey>('next');
  const [sortOpen, setSortOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [deleted, setDeleted] = useState<Countdown | null>(null);

  useEffect(() => {
    void loadViewMode().then(setViewModeState);
    void getSortKey().then(setSortKeyState);
  }, []);

  useEffect(() => {
    if (!deleted) return;
    const timer = setTimeout(() => setDeleted(null), 6000);
    return () => clearTimeout(timer);
  }, [deleted]);

  const changeView = useCallback(async (next: ViewMode) => {
    setViewModeState(next);
    await setViewMode(next);
  }, []);

  const changeSort = useCallback(async (next: SortKey) => {
    setSortKeyState(next);
    setSortOpen(false);
    await setSortKey(next);
  }, []);

  const { sorted, nextDays } = useMemo(() => {
    const rows: Row[] = (showArchived
      ? countdowns.filter((countdown) => countdown.archived)
      : countdowns
    ).map((countdown) => {
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
        created: countdown.createdAt,
      };
    });

    rows.sort((a, b) => {
      if (a.countdown.pinned !== b.countdown.pinned) return a.countdown.pinned ? -1 : 1;
      if (sortKey === 'newest') return b.created - a.created;
      if (sortKey === 'name') {
        return (a.countdown.title || formatTargetDate(a.countdown.targetDate)).localeCompare(
          b.countdown.title || formatTargetDate(b.countdown.targetDate)
        );
      }
      if (a.stale !== b.stale) return a.stale ? 1 : -1;
      return a.days - b.days;
    });

    const next = rows.find(
      (row) => !row.stale && row.countdown.direction === 'down' && !row.countdown.pinned
    ) ?? rows.find((row) => !row.stale && row.countdown.direction === 'down');
    return { sorted: rows, nextDays: next?.days ?? null };
  }, [countdowns, now, sortKey, showArchived]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((row) => {
      const haystack = `${row.countdown.title} ${row.countdown.notes ?? ''} ${formatTargetDate(
        row.countdown.targetDate
      )}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, sorted]);

  const summary = useMemo(() => {
    if (loading) return 'Reading your dates';
    const count = showArchived
      ? countdowns.filter((countdown) => countdown.archived).length
      : countdowns.length;
    if (showArchived) {
      return count === 0
        ? 'Nothing archived'
        : `${count} archived countdown${count === 1 ? '' : 's'}`;
    }
    if (count === 0) return 'Dates worth waiting for';
    const base = `${count} countdown${count === 1 ? '' : 's'}`;
    if (nextDays === null) return base;
    if (nextDays <= 0) return `${base}. One lands today.`;
    if (nextDays === 1) return `${base}. Next tomorrow.`;
    return `${base}. Next in ${nextDays} days.`;
  }, [countdowns, loading, nextDays, showArchived]);

  const gridItemWidth = (width - control.gutter * 2 - GRID_GAP) / 2;

  async function undoDelete() {
    if (!deleted) return;
    const record = deleted;
    setDeleted(null);
    await insertCountdown(record);
    await scheduleForCountdown(record);
    await reload();
  }

  const empty = useMemo(() => {
    if (loading) return null;
    if (error) {
      return (
        <EmptyState
          theme={theme}
          title="Could not read your countdowns"
          message={error}
          actionLabel="Try again"
          onAction={() => void reload()}
        />
      );
    }
    if (query.trim()) {
      return (
        <EmptyState
          theme={theme}
          title="No matches"
          message={`Nothing matches “${query.trim()}”.`}
          actionLabel="Clear search"
          onAction={() => setQuery('')}
        />
      );
    }
    if (showArchived) {
      return (
        <EmptyState
          theme={theme}
          title="Nothing archived"
          message="Countdowns you archive from the card menu will appear here."
          actionLabel="Back to countdowns"
          onAction={() => setShowArchived(false)}
        />
      );
    }
    return (
      <EmptyState
        theme={theme}
        title="No countdowns yet"
        message="Add a birthday, a trip, or a deadline to get started."
        actionLabel="Add your first countdown"
        onAction={() => router.push('/countdown/new')}
      />
    );
  }, [error, loading, query, reload, router, showArchived, theme]);

  return (
    <View style={styles.container}>
      <Tabs.Screen options={{ headerShown: false }} />

      <ScreenHeader
        title="Countdown"
        subtitle={summary}
        actions={<ViewToggle mode={viewMode} onChange={(next) => void changeView(next)} />}
      />

      <View style={styles.toolbar}>
        <View
          style={[
            styles.search,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search-outline" size={17} color={theme.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={theme.textFaint}
            accessibilityLabel="Search countdowns"
            selectionColor={theme.accentInk}
            style={[typography.body, styles.searchInput, { color: theme.text }]}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={10}
              onPress={() => setQuery('')}
            >
              <Ionicons name="close-circle" size={17} color={theme.textFaint} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sort countdowns"
          onPress={() => setSortOpen(true)}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons name="swap-vertical-outline" size={19} color={theme.text} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showArchived ? 'Hide archived countdowns' : 'Show archived countdowns'}
          accessibilityState={{ selected: showArchived }}
          onPress={() => {
            setShowArchived((value) => !value);
            setQuery('');
          }}
          style={({ pressed }) => [
            styles.toolButton,
            {
              backgroundColor: showArchived ? theme.accent : theme.surface,
              borderColor: showArchived ? theme.accent : theme.border,
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <Ionicons
            name="archive-outline"
            size={19}
            color={showArchived ? theme.accentText : theme.text}
          />
        </Pressable>
      </View>

      <FlatList
        data={visible}
        key={viewMode}
        keyExtractor={(item) => item.countdown.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        onRefresh={() => void reload()}
        refreshing={loading}
        ListEmptyComponent={empty}
        renderItem={({ item }) => (
          <CountdownCard
            countdown={item.countdown}
            now={now}
            layout={viewMode}
            style={viewMode === 'grid' ? [styles.gridItem, { maxWidth: gridItemWidth }] : styles.listItem}
            onPress={() => {
              void Haptics.selectionAsync();
              router.push(`/countdown/${item.countdown.id}`);
            }}
            onChanged={() => void reload()}
            onDeleted={setDeleted}
          />
        )}
      />

      {deleted ? (
        <View
          style={[
            styles.undo,
            { backgroundColor: theme.surfaceAlt, borderColor: theme.borderStrong },
          ]}
        >
          <Text numberOfLines={1} style={[typography.caption, styles.undoText, { color: theme.text }]}>
            Deleted {deleted.title.trim() || 'countdown'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Undo delete"
            onPress={() => void undoDelete()}
            hitSlop={8}
          >
            <Text style={[typography.bodyStrong, { color: theme.accentInk }]}>Undo</Text>
          </Pressable>
        </View>
      ) : null}

      {!showArchived ? (
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
      ) : null}

      <OptionPicker
        visible={sortOpen}
        title="Sort countdowns"
        options={SORT_OPTIONS}
        selected={sortKey}
        onSelect={(next) => void changeSort(next as SortKey)}
        onClose={() => setSortOpen(false)}
      />
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: control.gutter,
    paddingBottom: spacing.sm,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, padding: 0 },
  toolButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
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
  undo: {
    position: 'absolute',
    left: control.gutter,
    right: control.gutter + 70,
    bottom: spacing.lg,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  undoText: { flex: 1 },
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
