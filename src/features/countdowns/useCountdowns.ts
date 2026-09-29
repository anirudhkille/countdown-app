import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listCountdowns } from '../../data/countdownRepo';
import type { Countdown } from '../../domain/types';

export function useCountdowns() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const rows = await listCountdowns();
    setCountdowns(rows);
    setLoading(false);
  }, []);

  // The editor creates, edits and deletes, then calls router.back(). That neither
  // remounts this screen nor changes AppState, so without a focus reload the list
  // keeps showing the data it read on mount.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  // Returning from the background is a separate case: a recurrence may have rolled
  // over while the app was away, so the countdown values need recomputing too.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => sub.remove();
  }, [reload]);

  return { countdowns, loading, reload };
}
