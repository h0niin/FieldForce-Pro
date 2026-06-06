/**
 * Customer history offline caching — WatermelonDB edition.
 *
 * Replaces the previous AsyncStorage implementation. Uses a cache-aside
 * pattern where we manually write standard API responses into the SQLite
 * database (or LokiJS in Expo Go fallback mode) using database.batch().
 */
import { useCallback, useEffect, useState } from 'react';
import { Q } from '@nozbe/watermelondb';
import { contactsApi } from '@/api/endpoints';
import { database } from '@/db/database';
import ContactModel from '@/db/models/Contact';
import { useOffline } from './use-offline';
import type { Contact } from '@/types/models';

/**
 * Maps a WatermelonDB ContactModel back to the plain TS interface
 * so the rest of the application doesn't need to change.
 */
function mapModelToContact(record: ContactModel): Contact {
  let parsedTags: string[] | null = null;
  if (record.tags) {
    try {
      parsedTags = JSON.parse(record.tags);
    } catch {
      parsedTags = record.tags.split(',');
    }
  }

  return {
    id: record.serverId,
    tenant_id: record.tenantId,
    company_id: record.companyId,
    first_name: record.firstName ?? '',
    last_name: record.lastName ?? '',
    email: record.email,
    phone: record.phone,
    address: record.address,
    tags: parsedTags,
    custom_fields: null, // The schema doesn't store custom_fields securely
    created_at: new Date(record.createdAt).toISOString(),
    updated_at: new Date(record.updatedAt).toISOString(),
  };
}

async function readCache(): Promise<Contact[]> {
  try {
    const records = await database.get<ContactModel>('contacts').query().fetch();
    return records.map(mapModelToContact);
  } catch {
    return [];
  }
}

async function writeCache(contacts: Contact[]): Promise<void> {
  try {
    const contactCollection = database.get<ContactModel>('contacts');

    await database.write(async () => {
      // Clear out the old local cache first
      const existingRecords = await contactCollection.query().fetch();
      const deleted = existingRecords.map((r) => r.prepareDestroyPermanently());

      // Prepare fresh records
      const created = contacts.map((c) =>
        contactCollection.prepareCreate((record) => {
          record.serverId = c.id;
          record.tenantId = c.tenant_id;
          record.name = `${c.first_name} ${c.last_name}`.trim();
          record.firstName = c.first_name;
          record.lastName = c.last_name;
          record.email = c.email;
          record.phone = c.phone;
          record.company = null; // Optional denormalized field
          record.companyId = c.company_id;
          record.address = c.address;
          record.notes = null;
          record.tags = c.tags ? JSON.stringify(c.tags) : null;
        })
      );

      // Execute safely in one batch transaction
      await database.batch(...deleted, ...created);
    });
  } catch (error) {
    console.warn('[use-customer-history] cache write failure', error);
  }
}

function filterContacts(contacts: Contact[], query: string): Contact[] {
  if (!query.trim()) return contacts;
  const q = query.trim().toLowerCase();
  return contacts.filter(
    (c) =>
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false),
  );
}

/**
 * Cache-aside hook for the contacts list.
 * - Reads from WatermelonDB immediately on mount (works offline).
 * - Syncs contacts from the API in the background when online.
 * - Call sync() to manually trigger a refresh (e.g. pull-to-refresh).
 */
export function useContactsList(searchQuery: string) {
  const { isOffline } = useOffline();
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);

  // Debounce search so JS filter isn't called on every keystroke
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load cache on mount
  useEffect(() => {
    readCache().then((cached) => {
      setAllContacts(cached);
      setLoading(false);
    });
  }, []);

  // Background API sync — runs on mount (when online) and on manual trigger
  useEffect(() => {
    if (isOffline) return;

    let cancelled = false;
    setSyncing(true);

    contactsApi
      .getAllNonPaginated()
      .then(async (res) => {
        if (cancelled) return;
        const fresh = res.data.data ?? [];
        setAllContacts(fresh);
        await writeCache(fresh);
      })
      .catch((err) => {
        if (!cancelled) console.warn('[useContactsList] sync failed:', err);
      })
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOffline, syncTrigger]);

  const sync = useCallback(() => setSyncTrigger((t) => t + 1), []);

  const contacts = filterContacts(allContacts, debouncedQuery);

  return { contacts, loading, syncing, isOffline, sync };
}

/**
 * Cache-aside hook for a single contact detail.
 * Returns the cached Contact so the detail screen can show it when offline.
 */
export function useContactDetail(serverId: string | undefined) {
  const { isOffline } = useOffline();
  const [cached, setCached] = useState<Contact | null>(null);

  useEffect(() => {
    if (!serverId) return;

    // Instead of reading the whole cache, intelligently fetch just this record 
    // from WatermelonDB for better performance!
    database
      .get<ContactModel>('contacts')
      .query(Q.where('server_id', serverId))
      .fetch()
      .then((records) => {
        if (records.length > 0) {
          setCached(mapModelToContact(records[0]));
        } else {
          setCached(null);
        }
      })
      .catch(() => setCached(null));
  }, [serverId]);

  return { cached, isOffline };
}
