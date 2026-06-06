import { Database } from '@nozbe/watermelondb';
import { NativeModules } from 'react-native';
import schema from './schema';
import migrations from './migrations';
import { WorkOrder, Appointment, Contact, JobSheet, Timesheet, Trip, Pricebook } from './models';

const modelClasses = [WorkOrder, Appointment, Contact, JobSheet, Timesheet, Trip, Pricebook];

function createAdapter() {
  if (NativeModules.WMDatabaseBridge) {
    // Native dev-client or production build — use the fast SQLite adapter
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
    return new SQLiteAdapter({
      schema,
      migrations,
      onSetUpError: (error: Error) => {
        console.error('[WatermelonDB] Setup error:', error);
      },
    });
  }

  // Expo Go / environments without the native WMDatabaseBridge —
  // fall back to the pure-JS LokiJS adapter. Data is in-memory only
  // and will not persist between app restarts in this mode.
  console.warn(
    '[WatermelonDB] Native bridge not available (Expo Go). ' +
    'Using in-memory LokiJS adapter — data will not persist between restarts. ' +
    'Build with expo-dev-client for full offline support.',
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  return new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });
}

export const database = new Database({
  adapter: createAdapter(),
  modelClasses,
});
