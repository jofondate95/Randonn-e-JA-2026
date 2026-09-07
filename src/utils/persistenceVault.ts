import { RegistrationRecord } from '../types.js';

const STORAGE_VAULT_KEY = 'banco_2026_registrations_vault';
const STORAGE_LAST_SYNC_KEY = 'banco_2026_vault_last_sync';
const STORAGE_DELETED_KEY = 'banco_2026_deleted_registrations';

/**
 * Retrieve the list of IDs permanently deleted by administrator.
 */
export function getDeletedClientIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id) => typeof id === 'string' && id.trim()));
    }
    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * Record an ID as permanently deleted in client storage.
 */
export function markIdAsPermanentlyDeleted(id: string): void {
  try {
    const cleanId = String(id).trim();
    const deletedSet = getDeletedClientIds();
    deletedSet.add(cleanId);
    localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(deletedSet)));
  } catch (err) {
    console.warn('[Persistence Vault] Failed to record deleted ID:', err);
  }
}

/**
 * Permanently delete an individual registration from the client-side vault.
 */
export function removeFromClientVault(id: string): void {
  try {
    const cleanId = String(id).trim();
    markIdAsPermanentlyDeleted(cleanId);

    const currentVault = getFromClientVault();
    const filtered = currentVault.filter((r) => r.id !== cleanId);
    localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(filtered));
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[Persistence Vault] Failed to remove from client vault:', err);
  }
}

/**
 * Clear the entire client vault (used on total reset).
 */
export function clearClientVault(): void {
  try {
    const currentVault = getFromClientVault();
    const deletedSet = getDeletedClientIds();
    for (const r of currentVault) {
      if (r?.id) deletedSet.add(r.id);
    }
    localStorage.setItem(STORAGE_DELETED_KEY, JSON.stringify(Array.from(deletedSet)));
    localStorage.removeItem(STORAGE_VAULT_KEY);
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('[Persistence Vault] Failed to clear client vault:', err);
  }
}

/**
 * Save registrations into persistent client-side localStorage vault.
 * Intelligently merges by ID, purges permanently deleted records, and keeps the latest updatedAt.
 */
export function saveToClientVault(serverRegistrations: RegistrationRecord[]): RegistrationRecord[] {
  try {
    const deletedSet = getDeletedClientIds();
    const validServerList = Array.isArray(serverRegistrations)
      ? serverRegistrations.filter((r) => r && r.id && !deletedSet.has(r.id))
      : [];

    const currentVault = getFromClientVault().filter((r) => !deletedSet.has(r.id));
    const vaultMap = new Map<string, RegistrationRecord>(currentVault.map((r) => [r.id, r]));

    for (const r of validServerList) {
      if (!r || !r.id || deletedSet.has(r.id)) continue;
      const existing = vaultMap.get(r.id);
      if (!existing) {
        vaultMap.set(r.id, r);
      } else {
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const serverTime = new Date(r.updatedAt || r.createdAt || 0).getTime();
        if (serverTime >= existingTime) {
          vaultMap.set(r.id, { ...existing, ...r });
        }
      }
    }

    const mergedList = Array.from(vaultMap.values()).filter((r) => !deletedSet.has(r.id));
    localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(mergedList));
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
    return mergedList;
  } catch (err) {
    console.warn('[Persistence Vault] Failed to save to client vault:', err);
    return serverRegistrations;
  }
}

/**
 * Retrieve all registrations currently stored in client-side vault,
 * excluding any that were marked as permanently deleted.
 */
export function getFromClientVault(): RegistrationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deletedSet = getDeletedClientIds();
      return parsed.filter((r) => r && r.id && r.fullName && !deletedSet.has(r.id));
    }
    return [];
  } catch (err) {
    console.warn('[Persistence Vault] Error reading client vault:', err);
    return [];
  }
}

/**
 * Check if the client-side vault contains records that are missing from the server.
 * Filters out any record that was permanently deleted.
 */
export function findMissingOnServer(
  serverRegistrations: RegistrationRecord[],
  clientVault: RegistrationRecord[]
): RegistrationRecord[] {
  const deletedSet = getDeletedClientIds();
  const serverIds = new Set(serverRegistrations.map((r) => r.id));
  return clientVault.filter((r) => r && r.id && !serverIds.has(r.id) && !deletedSet.has(r.id));
}

/**
 * Synchronize client vault records back to server.
 */
export async function pushVaultToServer(
  token: string,
  recordsToPush?: RegistrationRecord[]
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const deletedSet = getDeletedClientIds();
  const rawRecords = recordsToPush || getFromClientVault();
  const records = rawRecords.filter((r) => r && r.id && !deletedSet.has(r.id));

  if (records.length === 0) {
    return { success: true, syncedCount: 0, message: 'Aucune donnée locale valide à synchroniser.' };
  }

  const res = await fetch('/api/admin/registrations/batch-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ registrations: records }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors de la synchronisation avec le serveur.');
  }

  localStorage.setItem(STORAGE_LAST_SYNC_KEY, new Date().toISOString());
  return {
    success: true,
    syncedCount: data.result?.syncedCount ?? records.length,
    message: data.message || 'Synchronisation réussie.',
  };
}

/**
 * Export client vault directly to a downloadable JSON file.
 */
export function downloadVaultAsJsonFile(): void {
  const vault = getFromClientVault();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalRecords: vault.length,
    registrations: vault,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `sauvegarde_securisee_inscrits_banco_2026_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
