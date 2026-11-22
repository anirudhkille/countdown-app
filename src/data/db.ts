import * as SQLite from 'expo-sqlite';

export const DATABASE_VERSION = 4;

export interface CountdownRow {
  id: string;
  title: string;
  notes: string | null;
  target_date: number;
  anchor_day: number | null;
  recurrence: string;
  direction: string;
  unit: string;
  show_time: number;
  color: string | null;
  reminders: string | null;
  remind_at: number | null;
  calendar_event_id: string | null;
  pinned: number;
  archived: number;
  created_at: number;
  updated_at: number;
}

let connection: Promise<SQLite.SQLiteDatabase> | null = null;

async function hasColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string
): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return columns.some((entry) => entry.name === column);
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (version === 0) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS countdowns (
          id                TEXT PRIMARY KEY NOT NULL,
          title             TEXT NOT NULL,
          notes             TEXT,
          target_date       INTEGER NOT NULL,
          recurrence        TEXT NOT NULL DEFAULT 'none',
          direction         TEXT NOT NULL DEFAULT 'down',
          unit              TEXT NOT NULL DEFAULT 'auto',
          show_time         INTEGER NOT NULL DEFAULT 0,
          theme_id          TEXT NOT NULL DEFAULT 'default',
          color             TEXT,
          font_family       TEXT,
          emoji             TEXT,
          remind_at         INTEGER,
          calendar_event_id TEXT,
          archived          INTEGER NOT NULL DEFAULT 0,
          created_at        INTEGER NOT NULL,
          updated_at        INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_countdowns_archived ON countdowns (archived);
        CREATE INDEX IF NOT EXISTS idx_countdowns_remind_at ON countdowns (remind_at);
      `);
      version = 1;
    }

    if (version === 1) {
      if (!(await hasColumn(db, 'countdowns', 'anchor_day'))) {
        await db.execAsync('ALTER TABLE countdowns ADD COLUMN anchor_day INTEGER;');
      }
      version = 2;
    }

    if (version === 2) {
      if (!(await hasColumn(db, 'countdowns', 'pinned'))) {
        await db.execAsync(
          'ALTER TABLE countdowns ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;'
        );
      }
      version = 3;
    }

    if (version === 3) {
      if (!(await hasColumn(db, 'countdowns', 'reminders'))) {
        await db.execAsync('ALTER TABLE countdowns ADD COLUMN reminders TEXT;');
      }
      version = 4;
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!connection) {
    connection = SQLite.openDatabaseAsync('countdown.db')
      .then(async (db) => {
        await migrate(db);
        return db;
      })
      .catch((error: unknown) => {
        connection = null;
        throw error;
      });
  }
  return connection;
}
