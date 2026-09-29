import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
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

  useEffect(() => {
    const initial = setTimeout(() => {
      void reload();
    }, 0);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => {
      clearTimeout(initial);
      sub.remove();
    };
  }, [reload]);

  return { countdowns, loading, reload };
}
