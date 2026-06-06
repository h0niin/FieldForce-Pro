import { synchronize } from '@nozbe/watermelondb/sync';
import type { Database } from '@nozbe/watermelondb';
import api from '@/api/api-client';
import { useSyncStore } from '@/store/sync.store';

/**
 * Placeholder sync implementation.
 * Requires native module setup (expo-dev-client + WatermelonDB adapter) to function.
 */
export async function syncDatabase(database: Database): Promise<void> {
  const syncStore = useSyncStore.getState();

  if (syncStore.isSyncing) return;

  syncStore.setSyncing(true);

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt }) => {
        const response = await api.get('/sync/pull', {
          params: { last_pulled_at: lastPulledAt },
        });

        const { changes, timestamp } = response.data.data;
        return { changes, timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        await api.post('/sync/push', {
          changes,
          last_pulled_at: lastPulledAt,
        });
      },
    });

    syncStore.setLastSyncAt(new Date().toISOString());
    syncStore.resetPending();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    syncStore.setSyncError(message);
    throw error;
  }
}
