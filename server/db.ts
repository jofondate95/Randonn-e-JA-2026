import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { RegistrationRecord, PaymentSettings, AdminUser } from '../src/types.js';

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

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const DEFAULT_SETTINGS: PaymentSettings = {
  momoNumber: '+225 07 58 42 10 90',
  momoRecipientName: 'Comité Randonnée Banco 2026',
  paymentAmount: '5 000 FCFA',
  waveLink: 'https://wave.com',
  orangeMoneyLink: 'https://orange.ci',
  mtnMoMoLink: 'https://mtn.ci',
  generalInstructions: 'Veuillez effectuer votre paiement par Wave, Orange Money ou MTN MoMo vers le numéro ci-dessous avec votre Nom et Prénom en motif. Conservez la capture de confirmation pour la soumettre.',
  eventDate: 'Dimanche 15 Novembre 2026',
  eventLocation: 'Forêt du Banco, Abidjan',
  eventName: 'Randonnée 2026',
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: DatabaseSchema = {
        settings: DEFAULT_SETTINGS,
        admins: [],
        registrations: [],
        drafts: {},
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      admins: parsed.admins || [],
      registrations: parsed.registrations || [],
      drafts: parsed.drafts || {},
    };
  } catch (error) {
    console.error('Error reading db.json, returning default fallback', error);
    return {
      settings: DEFAULT_SETTINGS,
      admins: [],
      registrations: [],
      drafts: {},
    };
  }
}

function writeDb(data: DatabaseSchema): void {
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
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

export const dbService = {
  hasAdmins(): boolean {
    const db = readDb();
    return db.admins.length > 0;
  },

  createFirstAdmin(email: string, password: string): AdminUser {
    const db = readDb();
    if (db.admins.length > 0) {
      throw new Error("L'administrateur initial a déjà été configuré.");
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
    fileMeta: { filename: string; originalName: string; mimeType: string; size: number }
  ): RegistrationRecord | null {
    const db = readDb();
    const record = db.registrations.find((r) => r.id === id);
    if (!record) return null;
    record.proofFile = {
      ...fileMeta,
      uploadedAt: new Date().toISOString(),
    };
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
};
