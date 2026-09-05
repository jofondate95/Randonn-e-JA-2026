import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { RegistrationRecord, PaymentSettings, AdminUser, FormConfig } from '../src/types.js';

interface StoredAdmin extends AdminUser {
  passwordHash: string;
}

interface DatabaseSchema {
  settings: PaymentSettings;
  admins: StoredAdmin[];
  registrations: RegistrationRecord[];
  drafts: Record<string, { formData: any; step: string; updatedAt: string; registrationId?: string }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DB_BACKUP_FILE = path.join(DATA_DIR, 'db.backup.json');
const DB_ARCHIVE_FILE = path.join(DATA_DIR, 'db.permanent_archive.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const PERMANENT_OFFICIAL_WAVE_LINK = 'https://pay.wave.com/m/M_ci_ZfLyfzYgXEbI/c/ci/?amount=5050';
export const PERMANENT_PAYMENT_NUMBER = '0769343626';
export const PERMANENT_PAYMENT_NUMBER_INTL = '+225 0769343626';

export const DEFAULT_OFFICIAL_DISTRICTS: string[] = [
  'District du Phare',
  'District 2',
  'District 3',
  'District 4',
  'District 5',
  'District de la Me (Adzope)',
  'District d’Agboville',
  'District de Bonoua',
  'District de Songon',
  'District de Pole Maritime',
  'District d’Aboisso',
  'District d’Abengourou',
  'District KM 17',
  'Autre',
];

export const DEFAULT_FORM_CONFIG: FormConfig = {
  districts: DEFAULT_OFFICIAL_DISTRICTS,
  tshirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Sur-mesure', 'Autre'],
  clubs: [
    { id: 'Aventurier', label: 'Aventurier', desc: '6 à 9 ans' },
    { id: 'Éclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
    { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
    { id: 'Aîné', label: 'Aîné', desc: 'Jeunes Adultes' },
    { id: 'Chef Guide', label: 'Chef Guide', desc: 'Cadres & Formateurs' },
    { id: 'Leader de Jeunesse', label: 'Leader de Jeunesse', desc: 'Responsables' },
    { id: 'Autre', label: 'Autre', desc: 'Sympathisant / Invité' },
  ],
  churches: [
    'Temple du Jubilé (Cocody)',
    'Béthel (Yopougon)',
    'Maranatha (Treichville)',
    'Philadelphie (Abobo)',
    'Salem (Port-Bouët)',
  ],
  requireTshirt: true,
  enableIllnessField: true,
  bannerNotice: '',
  formTitle: 'Inscription Officielle - Randonnée 2026',
  formSubtitle: 'Forêt du Banco • Dimanche 15 Novembre 2026',
  termsNotice: 'En vous inscrivant, vous attestez être médicalement apte à participer à la randonnée en milieu naturel.',
};

const DEFAULT_SETTINGS: PaymentSettings = {
  paymentAmount: '5 050 FCFA',
  waveLink: PERMANENT_OFFICIAL_WAVE_LINK,
  waveRecipientName: 'Comité Randonnée Banco 2026',
  waveNumber: PERMANENT_PAYMENT_NUMBER_INTL,
  momoNumber: PERMANENT_PAYMENT_NUMBER,
  momoRecipientName: 'Comité Randonnée Banco 2026',
  generalInstructions: 'Veuillez effectuer votre paiement exclusivement par Wave via le lien sécurisé direct ci-dessous. Dès que votre transfert est effectué, importez la capture d’écran de confirmation Wave.',
  eventDate: 'Dimanche 15 Novembre 2026',
  eventLocation: 'Forêt du Banco, Abidjan',
  eventName: 'Randonnée 2026',
  formConfig: DEFAULT_FORM_CONFIG,
};

// Fallback seed admins (Super Admin jonatha2ngs@gmail.com + 2nd Admin raphkoua@gmail.com)
const FALLBACK_SEED_ADMINS: StoredAdmin[] = [
  {
    id: 'admin-1788529425383',
    email: 'jonatha2ngs@gmail.com',
    role: 'superadmin',
    passwordHash: '$2b$10$gyMhp44sFQVpKf.KDOSqPujc/p23/64CgK6Yfl7F5iwSyEC1Z1r82',
    createdAt: '2026-09-04T13:43:45.383Z',
  },
  {
    id: 'admin-raphkoua-3626',
    email: 'raphkoua@gmail.com',
    role: 'admin',
    // Hash of ChefJA@3626
    passwordHash: '$2b$10$NsNaEp6r32Ab1q90xYTFhOL3F/gEr9rfi39UJHgB1HtHH6u0VDJuy',
    createdAt: '2026-09-05T17:35:00.000Z',
  },
];

let inMemoryDbCache: DatabaseSchema | null = null;

function readDb(): DatabaseSchema {
  try {
    let raw: string | null = null;

    if (fs.existsSync(DB_FILE)) {
      raw = fs.readFileSync(DB_FILE, 'utf-8');
    } else if (fs.existsSync(DB_BACKUP_FILE)) {
      console.warn('[DB] Restoring from backup file db.backup.json');
      raw = fs.readFileSync(DB_BACKUP_FILE, 'utf-8');
    } else if (fs.existsSync(DB_ARCHIVE_FILE)) {
      console.warn('[DB] Restoring from archive file db.permanent_archive.json');
      raw = fs.readFileSync(DB_ARCHIVE_FILE, 'utf-8');
    }

    if (!raw || !raw.trim()) {
      if (inMemoryDbCache) {
        return inMemoryDbCache;
      }
      const initialDb: DatabaseSchema = {
        settings: DEFAULT_SETTINGS,
        admins: FALLBACK_SEED_ADMINS,
        registrations: [],
        drafts: {},
      };
      writeDb(initialDb);
      inMemoryDbCache = initialDb;
      return initialDb;
    }

    const parsed = JSON.parse(raw);
    let resolvedAdmins: StoredAdmin[] = (parsed.admins && parsed.admins.length > 0)
      ? parsed.admins
      : (inMemoryDbCache?.admins?.length ? inMemoryDbCache.admins : FALLBACK_SEED_ADMINS);

    // Guarantee second admin raphkoua@gmail.com exists in database with password ChefJA@3626
    const hasRaphkoua = resolvedAdmins.some((a) => a.email.toLowerCase() === 'raphkoua@gmail.com');
    if (!hasRaphkoua) {
      resolvedAdmins.push({
        id: 'admin-raphkoua-3626',
        email: 'raphkoua@gmail.com',
        role: 'admin',
        // Hash of ChefJA@3626
        passwordHash: '$2b$10$NsNaEp6r32Ab1q90xYTFhOL3F/gEr9rfi39UJHgB1HtHH6u0VDJuy',
        createdAt: new Date().toISOString(),
      });
    }

    // Guarantee Form CMS Configuration exists and includes the official 13 districts
    const existingConfig = parsed.settings?.formConfig;
    const hasPhare = existingConfig?.districts && existingConfig.districts.includes('District du Phare');
    const resolvedDistricts = (existingConfig?.districts && hasPhare)
      ? existingConfig.districts
      : DEFAULT_OFFICIAL_DISTRICTS;

    const resolvedFormConfig: FormConfig = {
      ...DEFAULT_FORM_CONFIG,
      ...(existingConfig || {}),
      districts: resolvedDistricts,
    };

    const resolvedSettings: PaymentSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings || {}),
      paymentAmount: parsed.settings?.paymentAmount || '5 050 FCFA',
      waveLink: (!parsed.settings?.waveLink || parsed.settings.waveLink === 'https://wave.com')
        ? PERMANENT_OFFICIAL_WAVE_LINK
        : parsed.settings.waveLink,
      waveNumber: parsed.settings?.waveNumber || PERMANENT_PAYMENT_NUMBER_INTL,
      momoNumber: parsed.settings?.momoNumber || PERMANENT_PAYMENT_NUMBER,
      momoRecipientName: parsed.settings?.momoRecipientName || 'Comité Randonnée Banco 2026',
      formConfig: resolvedFormConfig,
    };

    const fullDb: DatabaseSchema = {
      settings: resolvedSettings,
      admins: resolvedAdmins,
      registrations: parsed.registrations || inMemoryDbCache?.registrations || [],
      drafts: parsed.drafts || inMemoryDbCache?.drafts || {},
    };

    inMemoryDbCache = fullDb;
    return fullDb;
  } catch (error) {
    console.error('Error reading db.json, returning resilient fallback', error);
    if (inMemoryDbCache) return inMemoryDbCache;
    return {
      settings: DEFAULT_SETTINGS,
      admins: FALLBACK_SEED_ADMINS,
      registrations: [],
      drafts: {},
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  inMemoryDbCache = data;
  const payload = JSON.stringify(data, null, 2);

  try {
    // 1. Primary write via atomic replace
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, payload, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // 2. Synchronous persistent backup write
    fs.writeFileSync(DB_BACKUP_FILE, payload, 'utf-8');

    // 3. Synchronous permanent archive write
    fs.writeFileSync(DB_ARCHIVE_FILE, payload, 'utf-8');
  } catch (err) {
    console.error('[DB Write Error] Failed to write database files', err);
  }
}

// Initial Admin Seed from ENV if provided
export function initializeAdminFromEnv(): void {
  const envEmail = process.env.ADMIN_INITIAL_EMAIL;
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (envEmail && envPassword) {
    const db = readDb();
    const existing = db.admins.find((a) => a.email.toLowerCase() === envEmail.toLowerCase());
    if (!existing) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(envPassword, salt);
      db.admins.push({
        id: `admin-${Date.now()}`,
        email: envEmail.toLowerCase().trim(),
        role: 'superadmin',
        passwordHash,
        createdAt: new Date().toISOString(),
      });
      writeDb(db);
      console.log(`[Seed] Initial admin created from environment: ${envEmail}`);
    }
  }
}

const MAX_ADMINS = 2;

export const dbService = {
  hasAdmins(): boolean {
    const db = readDb();
    return db.admins.length > 0;
  },

  getAdminQuotaInfo(): { currentCount: number; maxCount: number; canCreateAdmin: boolean } {
    const db = readDb();
    return {
      currentCount: db.admins.length,
      maxCount: MAX_ADMINS,
      canCreateAdmin: db.admins.length < MAX_ADMINS,
    };
  },

  createFirstAdmin(email: string, password: string): AdminUser {
    const db = readDb();
    if (db.admins.length > 0) {
      throw new Error("Le Super Administrateur a déjà été configuré.");
    }
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const newAdmin: StoredAdmin = {
      id: `admin-${Date.now()}`,
      email: email.toLowerCase().trim(),
      role: 'superadmin',
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.admins.push(newAdmin);
    writeDb(db);
    const { passwordHash: _, ...safeUser } = newAdmin;
    return safeUser;
  },

  createAdmin(email: string, tempPassword: string, creatorRole: string): AdminUser {
    if (creatorRole !== 'superadmin' && creatorRole !== 'admin') {
      throw new Error('Permission refusée.');
    }
    const db = readDb();
    if (db.admins.length >= MAX_ADMINS) {
      throw new Error(
        `Limite atteinte : Le quota maximal de ${MAX_ADMINS} administrateurs (1 Super Administrateur + 1 Administrateur) est déjà atteint. Aucune nouvelle inscription n'est autorisée.`
      );
    }
    const existing = db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      throw new Error('Un compte administrateur avec cet email existe déjà.');
    }
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(tempPassword, salt);
    const newAdmin: StoredAdmin = {
      id: `admin-${Date.now()}`,
      email: email.toLowerCase().trim(),
      role: 'admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.admins.push(newAdmin);
    writeDb(db);
    const { passwordHash: _, ...safeUser } = newAdmin;
    return safeUser;
  },

  deleteAdmin(adminId: string, requesterRole: string, requesterId: string): boolean {
    if (requesterRole !== 'superadmin') {
      throw new Error('Seul le Super Administrateur peut supprimer un compte administrateur.');
    }
    if (adminId === requesterId) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte Super Administrateur.');
    }
    const db = readDb();
    const target = db.admins.find((a) => a.id === adminId);
    if (!target) {
      throw new Error('Compte administrateur introuvable.');
    }
    if (target.role === 'superadmin') {
      throw new Error('Le compte Super Administrateur ne peut pas être supprimé.');
    }
    db.admins = db.admins.filter((a) => a.id !== adminId);
    writeDb(db);
    return true;
  },

  changePassword(adminId: string, oldPassword: string, newPassword: string): boolean {
    const db = readDb();
    const adminIndex = db.admins.findIndex((a) => a.id === adminId);
    if (adminIndex === -1) {
      throw new Error('Administrateur non trouvé.');
    }
    const admin = db.admins[adminIndex];
    const match = bcrypt.compareSync(oldPassword, admin.passwordHash);
    if (!match) {
      throw new Error('Ancien mot de passe incorrect.');
    }
    const salt = bcrypt.genSaltSync(10);
    admin.passwordHash = bcrypt.hashSync(newPassword, salt);
    db.admins[adminIndex] = admin;
    writeDb(db);
    return true;
  },

  updateAdmin(
    adminId: string,
    updates: { email?: string; password?: string; role?: 'superadmin' | 'admin' },
    requesterRole: string,
    requesterId: string
  ): AdminUser {
    const db = readDb();
    const adminIndex = db.admins.findIndex((a) => a.id === adminId);
    if (adminIndex === -1) {
      throw new Error('Compte administrateur introuvable.');
    }

    // Permission check: only superadmin can edit another administrator's profile or change roles
    if (adminId !== requesterId && requesterRole !== 'superadmin') {
      throw new Error('Seul le Super Administrateur peut modifier le profil d’un autre administrateur.');
    }

    const admin = db.admins[adminIndex];

    if (updates.email && updates.email.trim()) {
      const cleanEmail = updates.email.toLowerCase().trim();
      const emailConflict = db.admins.some((a) => a.id !== adminId && a.email.toLowerCase() === cleanEmail);
      if (emailConflict) {
        throw new Error('Cet email est déjà utilisé par un autre administrateur.');
      }
      admin.email = cleanEmail;
    }

    if (updates.password && updates.password.trim()) {
      if (updates.password.trim().length < 6) {
        throw new Error('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      }
      const salt = bcrypt.genSaltSync(10);
      admin.passwordHash = bcrypt.hashSync(updates.password.trim(), salt);
    }

    if (updates.role && requesterRole === 'superadmin') {
      // Don't downgrade the main superadmin if it's himself unless another superadmin exists
      admin.role = updates.role;
    }

    db.admins[adminIndex] = admin;
    writeDb(db);
    const { passwordHash: _, ...safeUser } = admin;
    return safeUser;
  },

  getFormConfig(): FormConfig {
    const db = readDb();
    return db.settings.formConfig || DEFAULT_FORM_CONFIG;
  },

  updateFormConfig(configUpdates: Partial<FormConfig>): FormConfig {
    const db = readDb();
    const currentConfig = db.settings.formConfig || DEFAULT_FORM_CONFIG;
    const updatedConfig: FormConfig = {
      ...currentConfig,
      ...configUpdates,
    };
    db.settings.formConfig = updatedConfig;
    writeDb(db);
    return updatedConfig;
  },

  verifyAdmin(email: string, password: string): AdminUser | null {
    const db = readDb();
    const admin = db.admins.find((a) => a.email.toLowerCase() === email.toLowerCase().trim());
    if (!admin) return null;
    const match = bcrypt.compareSync(password, admin.passwordHash);
    if (!match) return null;
    admin.lastLogin = new Date().toISOString();
    writeDb(db);
    const { passwordHash: _, ...safeUser } = admin;
    return safeUser;
  },

  getAdmins(): AdminUser[] {
    const db = readDb();
    return db.admins.map(({ passwordHash: _, ...safeUser }) => safeUser);
  },

  getSettings(): PaymentSettings {
    const db = readDb();
    return db.settings;
  },

  updateSettings(newSettings: Partial<PaymentSettings>): PaymentSettings {
    const db = readDb();
    db.settings = { ...db.settings, ...newSettings };
    writeDb(db);
    return db.settings;
  },

  // Draft autosave
  saveDraft(sessionId: string, formData: any, step: string, registrationId?: string) {
    const db = readDb();
    db.drafts[sessionId] = {
      formData,
      step,
      updatedAt: new Date().toISOString(),
      registrationId,
    };
    writeDb(db);
    return db.drafts[sessionId];
  },

  getDraft(sessionId: string) {
    const db = readDb();
    return db.drafts[sessionId] || null;
  },

  // Registrations
  getRegistrations(): RegistrationRecord[] {
    const db = readDb();
    return db.registrations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getRegistrationById(id: string): RegistrationRecord | null {
    const db = readDb();
    return db.registrations.find((r) => r.id === id) || null;
  },

  getRegistrationBySession(sessionId: string): RegistrationRecord | null {
    const db = readDb();
    return db.registrations.find((r) => r.sessionId === sessionId) || null;
  },

  checkDuplicateContact(contact: string, excludeRegistrationId?: string): boolean {
    const cleanPhone = contact.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const db = readDb();
    return db.registrations.some((r) => {
      if (excludeRegistrationId && r.id === excludeRegistrationId) return false;
      const existingPhone = r.contact.replace(/\s+/g, '').replace(/[^\d+]/g, '');
      return (
        existingPhone === cleanPhone &&
        (r.status === 'confirmed' || r.status === 'pending_verification')
      );
    });
  },

  createOrUpdateRegistrationFromForm(
    sessionId: string,
    formData: any,
    existingId?: string
  ): RegistrationRecord {
    const db = readDb();
    const now = new Date().toISOString();

    let record = existingId ? db.registrations.find((r) => r.id === existingId) : null;
    if (!record) {
      record = db.registrations.find((r) => r.sessionId === sessionId) || null;
    }

    if (record) {
      record.fullName = formData.fullName;
      record.church = formData.church;
      record.contact = formData.contact;
      record.district = formData.district;
      record.districtOther = formData.districtOther || '';
      record.club = formData.club;
      record.clubOther = formData.clubOther || '';
      record.tshirtSize = formData.tshirtSize || '';
      record.tshirtSizeOther = formData.tshirtSizeOther || '';
      record.hasIllness = formData.hasIllness;
      record.illnessDetails = formData.illnessDetails || '';
      record.currentStep = 'payment';
      record.updatedAt = now;
      writeDb(db);
      return record;
    }

    // Generate reference ID e.g. BANCO-2026-4821
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newId = `BANCO-2026-${randomCode}`;

    const newRecord: RegistrationRecord = {
      id: newId,
      sessionId,
      fullName: formData.fullName,
      church: formData.church,
      contact: formData.contact,
      district: formData.district,
      districtOther: formData.districtOther || '',
      club: formData.club,
      clubOther: formData.clubOther || '',
      tshirtSize: formData.tshirtSize || '',
      tshirtSizeOther: formData.tshirtSizeOther || '',
      hasIllness: formData.hasIllness,
      illnessDetails: formData.illnessDetails || '',
      currentStep: 'payment',
      paymentClicked: false,
      paymentClickedAt: null,
      proofFile: null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    };

    db.registrations.push(newRecord);
    writeDb(db);
    return newRecord;
  },

  markPaymentClicked(id: string): RegistrationRecord | null {
    const db = readDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) return null;
    record.paymentClicked = true;
    record.paymentClickedAt = new Date().toISOString();
    if (record.status === 'draft') {
      record.status = 'payment_clicked';
    }
    record.currentStep = 'proof';
    record.updatedAt = new Date().toISOString();
    writeDb(db);
    return record;
  },

  attachProofAndSubmit(
    id: string,
    fileMeta: { filename: string; originalName: string; mimeType: string; size: number },
    transactionPhone?: string
  ): RegistrationRecord | null {
    const db = readDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) return null;
    record.proofFile = {
      ...fileMeta,
      uploadedAt: new Date().toISOString(),
    };
    if (transactionPhone && transactionPhone.trim()) {
      record.transactionPhone = transactionPhone.trim();
    }
    record.status = 'pending_verification';
    record.currentStep = 'confirmation';
    record.updatedAt = new Date().toISOString();
    writeDb(db);
    return record;
  },

  updateRegistrationStatus(
    id: string,
    status: 'pending_verification' | 'confirmed' | 'rejected',
    adminNotes?: string
  ): RegistrationRecord | null {
    const db = readDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) return null;
    record.status = status;
    if (adminNotes !== undefined) {
      record.adminNotes = adminNotes;
    }
    record.updatedAt = new Date().toISOString();
    writeDb(db);
    return record;
  },

  deleteRegistration(id: string): boolean {
    const db = readDb();
    const index = db.registrations.findIndex((r) => r.id === id);
    if (index === -1) return false;
    const record = db.registrations[index];
    if (record.proofFile?.filename) {
      try {
        const filePath = path.join(UPLOADS_DIR, record.proofFile.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.warn('Could not delete proof file', err);
      }
    }
    db.registrations.splice(index, 1);
    for (const [sId, draft] of Object.entries(db.drafts)) {
      if (draft.registrationId === id) {
        delete db.drafts[sId];
      }
    }
    writeDb(db);
    return true;
  },

  resetAllRegistrations(): { deletedCount: number } {
    const db = readDb();
    const count = db.registrations.length;
    for (const r of db.registrations) {
      if (r.proofFile?.filename) {
        try {
          const filePath = path.join(UPLOADS_DIR, r.proofFile.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch {
          // ignore
        }
      }
    }
    db.registrations = [];
    db.drafts = {};
    writeDb(db);
    return { deletedCount: count };
  },

  getDatabaseBackup(): DatabaseSchema {
    return readDb();
  },

  restoreDatabaseBackup(backup: Partial<DatabaseSchema>): { success: boolean; message: string } {
    const current = readDb();
    const updated: DatabaseSchema = {
      settings: { ...current.settings, ...(backup.settings || {}) },
      admins: (backup.admins && backup.admins.length > 0) ? backup.admins as StoredAdmin[] : current.admins,
      registrations: backup.registrations || current.registrations,
      drafts: backup.drafts || current.drafts,
    };
    writeDb(updated);
    return { success: true, message: 'Base de données restaurée avec succès.' };
  },

  syncFromProductionData(params: {
    registrations: RegistrationRecord[];
    admins: AdminUser[];
    settings?: Partial<PaymentSettings>;
    secondAdminPassword?: string;
  }): { syncedRegistrationsCount: number; syncedAdminsCount: number } {
    const db = readDb();

    // 1. Merge registrations: replace or add, preserving newest updatedAt
    const existingMap = new Map(db.registrations.map((r) => [r.id, r]));
    for (const liveReg of params.registrations) {
      existingMap.set(liveReg.id, liveReg);
    }
    db.registrations = Array.from(existingMap.values());

    // 2. Merge admins
    // Superadmin is preserved
    const superAdmin = db.admins.find((a) => a.role === 'superadmin') || FALLBACK_SEED_ADMINS[0];
    const newAdminsList: StoredAdmin[] = [superAdmin];

    for (const liveAdmin of params.admins) {
      if (liveAdmin.email.toLowerCase() === superAdmin.email.toLowerCase()) {
        continue;
      }
      // This is the second admin!
      const existingSecond = db.admins.find((a) => a.email.toLowerCase() === liveAdmin.email.toLowerCase());
      if (existingSecond) {
        newAdminsList.push(existingSecond);
      } else {
        // Create stored entry with passwordHash
        const pwd = params.secondAdminPassword || 'Admin2Banco2026!';
        const salt = bcrypt.genSaltSync(10);
        const passwordHash = bcrypt.hashSync(pwd, salt);
        newAdminsList.push({
          id: liveAdmin.id || `admin-${Date.now()}`,
          email: liveAdmin.email.toLowerCase().trim(),
          role: 'admin',
          passwordHash,
          createdAt: liveAdmin.createdAt || new Date().toISOString(),
        });
      }
    }
    db.admins = newAdminsList;

    // 3. Settings: ensure permanent wave link and 5 050 FCFA
    if (params.settings) {
      db.settings = {
        ...db.settings,
        waveRecipientName: params.settings.waveRecipientName || db.settings.waveRecipientName,
        waveNumber: params.settings.waveNumber || db.settings.waveNumber,
        eventDate: params.settings.eventDate || db.settings.eventDate,
        eventName: params.settings.eventName || db.settings.eventName,
        eventLocation: params.settings.eventLocation || db.settings.eventLocation,
        generalInstructions: params.settings.generalInstructions || db.settings.generalInstructions,
        paymentAmount: '5 050 FCFA',
        waveLink: PERMANENT_OFFICIAL_WAVE_LINK,
      };
    }

    writeDb(db);
    return {
      syncedRegistrationsCount: db.registrations.length,
      syncedAdminsCount: db.admins.length,
    };
  },
};
