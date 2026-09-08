import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  setLogLevel,
} from 'firebase/firestore/lite';
import { PaymentSettings, RegistrationRecord } from '../src/types.js';

// Suppress internal verbosity warnings
try {
  setLogLevel('error');
} catch {
  // Ignore if not supported
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let isInitialized = false;

function loadFirebaseConfig() {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Firestore] Failed to read firebase-applet-config.json:', e);
    }
  }
  return null;
}

export function getFirestoreClient(): Firestore | null {
  if (isInitialized && firestoreDb) {
    return firestoreDb;
  }

  try {
    const config = loadFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
      console.warn('[Firestore] No valid Firebase configuration found.');
      return null;
    }

    if (!getApps().length) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    } else {
      firebaseApp = getApp();
    }

    const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
      ? config.firestoreDatabaseId
      : undefined;

    firestoreDb = databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);
    isInitialized = true;
    console.log('[Firestore] Connected successfully to Cloud Firestore database:', databaseId || '(default)');
    return firestoreDb;
  } catch (error) {
    console.error('[Firestore] Initialization error:', error);
    return null;
  }
}

/**
 * Fetch global settings from Firestore
 */
export async function fetchCloudSettings(): Promise<PaymentSettings | null> {
  const db = getFirestoreClient();
  if (!db) return null;

  try {
    const settingsDoc = await getDoc(doc(db, 'app_settings', 'global'));
    if (settingsDoc.exists()) {
      console.log('[Firestore] Successfully retrieved settings from Cloud');
      return settingsDoc.data() as PaymentSettings;
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Error fetching settings from Cloud:', err);
    return null;
  }
}

/**
 * Persist global settings permanently to Firestore
 */
export async function saveCloudSettings(settings: PaymentSettings): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db) return false;

  try {
    const cleanSettings = JSON.parse(JSON.stringify(settings));
    await setDoc(doc(db, 'app_settings', 'global'), cleanSettings, { merge: true });
    console.log('[Firestore] Settings permanently saved to Cloud Firestore');
    return true;
  } catch (err) {
    console.error('[Firestore] Failed to save settings to Cloud:', err);
    return false;
  }
}

/**
 * Fetch all deleted registration IDs from Firestore
 */
export async function fetchCloudDeletedIds(): Promise<string[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'deleted_registrations'));
    const ids: string[] = [];
    snapshot.forEach((d) => {
      ids.push(d.id);
    });
    return ids;
  } catch (err) {
    console.warn('[Firestore] Error fetching deleted registration IDs from Cloud:', err);
    return [];
  }
}

/**
 * Record deleted IDs in Firestore
 */
export async function saveCloudDeletedIds(ids: string[]): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !ids.length) return false;

  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    for (const id of ids) {
      if (!id || typeof id !== 'string') continue;
      const ref = doc(db, 'deleted_registrations', id.trim());
      batch.set(ref, { id: id.trim(), deletedAt: now });
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving deleted IDs to Cloud:', err);
    return false;
  }
}

/**
 * Fetch all registrations from Firestore
 */
export async function fetchCloudRegistrations(): Promise<RegistrationRecord[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'registrations'));
    const records: RegistrationRecord[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as RegistrationRecord;
      if (data && data.id) {
        records.push(data);
      }
    });
    console.log(`[Firestore] Retrieved ${records.length} registrations from Cloud`);
    return records;
  } catch (err) {
    console.warn('[Firestore] Error fetching registrations from Cloud:', err);
    return [];
  }
}

/**
 * Save single registration permanently to Firestore
 */
export async function saveCloudRegistration(record: RegistrationRecord): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !record || !record.id) return false;

  try {
    const cleanRecord = JSON.parse(JSON.stringify(record));
    // Protect Firestore from document size limit (1MB max per document)
    // If dataUrl is larger than 600KB, strip dataUrl from Firestore document to avoid Firestore payload error,
    // while keeping all metadata, originalName, filename, size, etc.
    if (cleanRecord.proofFile && cleanRecord.proofFile.dataUrl && cleanRecord.proofFile.dataUrl.length > 600000) {
      delete cleanRecord.proofFile.dataUrl;
    }
    await setDoc(doc(db, 'registrations', record.id), cleanRecord, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving registration ${record.id} to Cloud:`, err);
    return false;
  }
}

/**
 * Save multiple registrations to Firestore in batches
 */
export async function saveCloudRegistrationsBatch(records: RegistrationRecord[]): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !Array.isArray(records) || records.length === 0) return false;

  try {
    // Firestore batch limit is 500 operations
    const chunks: RegistrationRecord[][] = [];
    for (let i = 0; i < records.length; i += 400) {
      chunks.push(records.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const rec of chunk) {
        if (!rec || !rec.id) continue;
        const cleanRec = JSON.parse(JSON.stringify(rec));
        if (cleanRec.proofFile && cleanRec.proofFile.dataUrl && cleanRec.proofFile.dataUrl.length > 600000) {
          delete cleanRec.proofFile.dataUrl;
        }
        const ref = doc(db, 'registrations', rec.id);
        batch.set(ref, cleanRec, { merge: true });
      }
      await batch.commit();
    }
    return true;
  } catch (err) {
    console.error('[Firestore] Error batch saving registrations to Cloud:', err);
    return false;
  }
}

export interface CloudAdminDoc {
  id: string;
  email: string;
  role: 'superadmin' | 'admin';
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

/**
 * Fetch all admin accounts from Firestore
 */
export async function fetchCloudAdmins(): Promise<CloudAdminDoc[]> {
  const db = getFirestoreClient();
  if (!db) return [];

  try {
    const snapshot = await getDocs(collection(db, 'admin_accounts'));
    const admins: CloudAdminDoc[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as CloudAdminDoc;
      if (data && data.email && data.passwordHash) {
        admins.push(data);
      }
    });
    console.log(`[Firestore] Retrieved ${admins.length} admin accounts from Cloud`);
    return admins;
  } catch (err) {
    console.warn('[Firestore] Error fetching admins from Cloud:', err);
    return [];
  }
}

/**
 * Save single admin account to Firestore
 */
export async function saveCloudAdmin(admin: CloudAdminDoc): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !admin || !admin.id) return false;

  try {
    const cleanAdmin = JSON.parse(JSON.stringify(admin));
    await setDoc(doc(db, 'admin_accounts', admin.id), cleanAdmin, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] Error saving admin ${admin.email} to Cloud:`, err);
    return false;
  }
}

/**
 * Save multiple admin accounts to Firestore
 */
export async function saveCloudAdminsBatch(admins: CloudAdminDoc[]): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !Array.isArray(admins) || admins.length === 0) return false;

  try {
    const batch = writeBatch(db);
    for (const a of admins) {
      if (!a || !a.id) continue;
      const ref = doc(db, 'admin_accounts', a.id);
      batch.set(ref, JSON.parse(JSON.stringify(a)), { merge: true });
    }
    await batch.commit();
    return true;
  } catch (err) {
    console.error('[Firestore] Error batch saving admins to Cloud:', err);
    return false;
  }
}

/**
 * Delete admin account from Firestore
 */
export async function deleteCloudAdmin(adminId: string): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !adminId) return false;

  try {
    await deleteDoc(doc(db, 'admin_accounts', adminId));
    console.log(`[Firestore] Admin ${adminId} deleted from Cloud Firestore`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error deleting admin ${adminId} from Cloud:`, err);
    return false;
  }
}

/**
 * Save registration draft to Firestore
 */
export async function saveCloudDraft(sessionId: string, draftData: any): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !sessionId) return false;

  try {
    await setDoc(
      doc(db, 'registration_drafts', sessionId),
      {
        sessionId,
        draftData: JSON.parse(JSON.stringify(draftData)),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn(`[Firestore] Error saving draft ${sessionId} to Cloud:`, err);
    return false;
  }
}

/**
 * Fetch registration draft from Firestore
 */
export async function fetchCloudDraft(sessionId: string): Promise<any | null> {
  const db = getFirestoreClient();
  if (!db || !sessionId) return null;

  try {
    const d = await getDoc(doc(db, 'registration_drafts', sessionId));
    if (d.exists()) {
      return d.data().draftData || null;
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] Error fetching draft ${sessionId} from Cloud:`, err);
    return null;
  }
}

/**
 * Permanently delete a registration from Firestore
 */
export async function deleteCloudRegistration(id: string): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db || !id) return false;

  try {
    const cleanId = id.trim();
    await deleteDoc(doc(db, 'registrations', cleanId));
    await setDoc(doc(db, 'deleted_registrations', cleanId), {
      id: cleanId,
      deletedAt: new Date().toISOString(),
    });
    console.log(`[Firestore] Registration ${cleanId} permanently deleted from Cloud`);
    return true;
  } catch (err) {
    console.error(`[Firestore] Error deleting registration ${id} from Cloud:`, err);
    return false;
  }
}

/**
 * Wipe all registrations in Firestore
 */
export async function clearAllCloudRegistrations(): Promise<boolean> {
  const db = getFirestoreClient();
  if (!db) return false;

  try {
    const snapshot = await getDocs(collection(db, 'registrations'));
    const chunks: string[] = [];
    snapshot.forEach((d) => chunks.push(d.id));

    for (let i = 0; i < chunks.length; i += 400) {
      const batch = writeBatch(db);
      const sub = chunks.slice(i, i + 400);
      for (const id of sub) {
        batch.delete(doc(db, 'registrations', id));
      }
      await batch.commit();
    }
    console.log('[Firestore] All registrations wiped from Cloud');
    return true;
  } catch (err) {
    console.error('[Firestore] Error clearing registrations from Cloud:', err);
    return false;
  }
}
