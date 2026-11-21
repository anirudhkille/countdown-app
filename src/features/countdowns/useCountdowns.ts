import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listCountdowns } from '../../data/countdownRepo';
import type { Countdown } from '../../domain/types';

export function useCountdowns() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await listCountdowns();
      setCountdowns(rows);
      setError(null);
    } catch {
      setError('Your countdowns could not be read.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => sub.remove();
  }, [reload]);

  return { countdowns, loading, error, reload };
}
