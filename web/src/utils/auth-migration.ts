/**
 * Migration utility to clean up old token-based auth storage
 * This should be called once on app initialization
 */

const MIGRATION_KEY = 'auth_migration_v2_done';

export function migrateAuthStorage() {
  // Check if migration already done
  if (localStorage.getItem(MIGRATION_KEY)) {
    return;
  }

  try {
    console.log('[Auth Migration] Starting cookie-based auth migration...');

    // Get the old auth storage
    const oldAuthStorage = localStorage.getItem('auth-storage');

    if (oldAuthStorage) {
      const parsed = JSON.parse(oldAuthStorage);

      // If there are tokens in the old storage, clear them completely
      if (parsed.state?.accessToken || parsed.state?.refreshToken) {
        console.log('[Auth Migration] Cleaning up old token storage...');

        // Clear everything - user will re-authenticate via cookies if they're still valid
        const newState = {
          state: {
            user: null,
            isAuthenticated: false,
          },
          version: 2,
        };

        localStorage.setItem('auth-storage', JSON.stringify(newState));
        console.log('[Auth Migration] Migration complete. Authentication will be verified via cookies.');
      }
    }

    // Mark migration as done
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log('[Auth Migration] Migration marked as complete.');
  } catch (error) {
    console.error('[Auth Migration] Error during migration:', error);
    // Even if there's an error, mark as done to avoid infinite loops
    localStorage.setItem(MIGRATION_KEY, 'true');
  }
}
