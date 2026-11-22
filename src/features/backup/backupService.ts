import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  deleteAllCountdowns,
  insertCountdown,
  listAllCountdowns,
} from '../../data/countdownRepo';
import type { Countdown } from '../../domain/types';
import { buildBackup, parseBackup, type ParsedBackup } from './backupFormat';

export type RestoreMode = 'merge' | 'replace';

export async function exportBackup(now: number): Promise<number> {
  const countdowns = await listAllCountdowns();
  const file = new File(Paths.cache, `countdown-backup-${dateStamp(now)}.json`);
  file.create({ overwrite: true });
  file.write(buildBackup(countdowns, now));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('This device cannot open a share sheet.');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Countdown backup',
  });
  return countdowns.length;
}

export async function pickBackup(): Promise<ParsedBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ['application/json', 'text/plain'],
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;

  const raw = await new File(asset.uri).text();
  return parseBackup(raw);
}

export async function applyBackup(
  countdowns: Countdown[],
  mode: RestoreMode
): Promise<{ imported: number; skipped: number }> {
  if (mode === 'replace') {
    await deleteAllCountdowns();
    for (const countdown of countdowns) {
      await insertCountdown(countdown);
    }
    return { imported: countdowns.length, skipped: 0 };
  }

  const existing = new Set((await listAllCountdowns()).map((countdown) => countdown.id));
  let imported = 0;
  let skipped = 0;
  for (const countdown of countdowns) {
    if (existing.has(countdown.id)) {
      skipped += 1;
      continue;
    }
    existing.add(countdown.id);
    await insertCountdown(countdown);
    imported += 1;
  }
  return { imported, skipped };
}

function dateStamp(now: number): string {
  const date = new Date(now);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
