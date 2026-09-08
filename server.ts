import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { dbService, initializeAdminFromEnv, DEFAULT_OFFICIAL_DISTRICTS, DEFAULT_FORM_CONFIG } from './server/db.js';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'banco_2026_hike_jwt_secret_token_key_ci';
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initialize admin from ENV if provided
initializeAdminFromEnv();

// Configure Multer for secure payment proofs
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `proof-${uniqueSuffix}-${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.'));
    }
  },
});

// Multer for CMS Header Banners and Logos
const bannerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cms-${uniqueSuffix}-${safeBase}${ext}`);
  },
});

const uploadBanner = multer({
  storage: bannerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Veuillez sélectionner une image (PNG, JPG, WEBP, SVG).'));
    }
  },
});

// Middleware
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Auth Middleware for Admin Routes
interface AuthRequest extends Request {
  adminUser?: { id: string; email: string; role: string };
}

function requireAdminAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.adminUser = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
    return;
  }
}

// ==========================================
// PUBLIC REGISTRATION API
// ==========================================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PERMANENT_OFFICIAL_WAVE_URL = 'https://pay.wave.com/m/M_ci_ZfLyfzYgXEbI/c/ci/?amount=5050';

// Get public settings (payment details, event info, and dynamic form configuration)
app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = dbService.getSettings();
  const formConfig = settings.formConfig || dbService.getFormConfig();
  res.json({
    paymentAmount: settings.paymentAmount || '5 050 FCFA',
    waveLink: (settings.waveLink && settings.waveLink !== 'https://wave.com') ? settings.waveLink : PERMANENT_OFFICIAL_WAVE_URL,
    waveRecipientName: settings.waveRecipientName || settings.momoRecipientName || 'Comité Randonnée Banco 2026',
    waveNumber: '',
    momoNumber: '',
    momoRecipientName: settings.waveRecipientName || settings.momoRecipientName || 'Comité Randonnée Banco 2026',
    generalInstructions: settings.generalInstructions,
    eventDate: settings.eventDate,
    eventLocation: settings.eventLocation,
    eventName: settings.eventName,
    orangeMoneyLink: '',
    mtnMoMoLink: '',
    formConfig,
  });
});

// Public Dynamic Form CMS Configuration
app.get('/api/form-config', (_req: Request, res: Response) => {
  const formConfig = dbService.getFormConfig();
  res.json({ config: formConfig });
});

// Autosave endpoint (saved every 2 minutes or on change)
app.post('/api/registration/autosave', (req: Request, res: Response) => {
  const { sessionId, formData, step, registrationId } = req.body;
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID requis pour la sauvegarde.' });
    return;
  }
  const saved = dbService.saveDraft(sessionId, formData, step, registrationId);
  res.json({ success: true, savedAt: saved.updatedAt });
});

// Restore session endpoint
app.get('/api/registration/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const draft = dbService.getDraft(sessionId);
  const registration = dbService.getRegistrationBySession(sessionId);

  res.json({
    draft,
    registration,
  });
});

// Submit Form Step 1
app.post('/api/registration/submit-form', (req: Request, res: Response) => {
  const { sessionId, formData, registrationId } = req.body;

  if (!sessionId || !formData) {
    res.status(400).json({ error: 'Données de formulaire manquantes.' });
    return;
  }

  const formCfg = dbService.getFormConfig();

  // Basic validations
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    res.status(400).json({ error: 'Le Nom et Prénoms sont obligatoires (au moins 2 caractères).' });
    return;
  }

  // Church field validation if enabled and required
  if (formCfg.enableChurchField !== false && formCfg.requireChurchField !== false) {
    if (!formData.church || formData.church.trim().length < 2) {
      res.status(400).json({ error: "L'église ou structure de provenance est obligatoire." });
      return;
    }
  }

  // Contact field validation if enabled
  if (formCfg.enableContactField !== false) {
    if (!formData.contact || formData.contact.trim().length < 6) {
      res.status(400).json({ error: 'Un numéro de contact valide est obligatoire.' });
      return;
    }
  }

  // District validation if enabled
  if (formCfg.enableDistrictField !== false) {
    if (!formData.district) {
      res.status(400).json({ error: 'Le District est obligatoire.' });
      return;
    }
    if (formData.district === 'Autre' && !formData.districtOther?.trim()) {
      res.status(400).json({ error: 'Veuillez préciser votre District.' });
      return;
    }
  }

  // Club validation if enabled
  if (formCfg.enableClubField !== false) {
    if (!formData.club) {
      res.status(400).json({ error: 'Le Club ou groupe est obligatoire.' });
      return;
    }
    if (formData.club === 'Autre' && !formData.clubOther?.trim()) {
      res.status(400).json({ error: 'Veuillez préciser votre Club.' });
      return;
    }
  }

  // Tshirt validation if enabled and required
  if (formCfg.enableTshirtField !== false && formCfg.requireTshirt) {
    if (!formData.tshirtSize) {
      res.status(400).json({ error: 'Veuillez sélectionner une taille de tee-shirt.' });
      return;
    }
    if (formData.tshirtSize === 'Autre' && !formData.tshirtSizeOther?.trim()) {
      res.status(400).json({ error: 'Veuillez préciser votre taille de tee-shirt.' });
      return;
    }
  }

  // Medical illness validation if enabled
  if (formCfg.enableIllnessField !== false) {
    if (formCfg.requireIllnessField && !formData.hasIllness) {
      res.status(400).json({ error: 'Veuillez indiquer si vous avez des antécédents médicaux ou allergies.' });
      return;
    }
    if (formData.hasIllness === 'Oui' && !formData.illnessDetails?.trim()) {
      res.status(400).json({ error: 'Veuillez préciser la nature de votre maladie ou allergie.' });
      return;
    }
  }

  // Custom Fields validation
  if (formCfg.customFields && Array.isArray(formCfg.customFields)) {
    for (const field of formCfg.customFields) {
      if (field.required) {
        const val = formData.customFields?.[field.id];
        if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
          res.status(400).json({ error: `Le champ « ${field.label} » est obligatoire.` });
          return;
        }
      }
    }
  }

  // Anti-duplicate phone check (if contact enabled)
  if (formCfg.enableContactField !== false && formData.contact) {
    const isDuplicate = dbService.checkDuplicateContact(formData.contact, registrationId);
    if (isDuplicate) {
      res.status(409).json({
        error: 'Une inscription avec ce numéro de contact est déjà enregistrée ou en cours de vérification.',
      });
      return;
    }
  }

  const record = dbService.createOrUpdateRegistrationFromForm(sessionId, formData, registrationId);
  // Also update draft state
  dbService.saveDraft(sessionId, formData, 'payment', record.id);

  res.json({
    success: true,
    registration: record,
  });
});

// Track payment click
app.post('/api/registration/track-payment-click', (req: Request, res: Response) => {
  const { registrationId } = req.body;
  if (!registrationId) {
    res.status(400).json({ error: 'ID inscription requis.' });
    return;
  }
  const updated = dbService.markPaymentClicked(registrationId);
  if (!updated) {
    res.status(404).json({ error: 'Inscription non trouvée.' });
    return;
  }
  res.json({ success: true, registration: updated });
});

// Upload proof of payment
app.post('/api/registration/upload-proof', upload.single('proof'), (req: Request, res: Response) => {
  const file = req.file;
  const registrationId = req.body.registrationId;
  const transactionPhone = req.body.transactionPhone;

  if (!file) {
    res.status(400).json({ error: 'Veuillez joindre une image ou capture de votre preuve de paiement.' });
    return;
  }
  if (!registrationId) {
    // delete uploaded file if no id provided
    fs.unlinkSync(file.path);
    res.status(400).json({ error: 'ID inscription requis.' });
    return;
  }

  let dataUrl: string | undefined = undefined;
  if (file.size <= 3 * 1024 * 1024) {
    try {
      const fileBuf = fs.readFileSync(file.path);
      dataUrl = `data:${file.mimetype};base64,${fileBuf.toString('base64')}`;
    } catch (e) {
      console.warn('Could not generate dataUrl for proof:', e);
    }
  }

  const fileMeta = {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    dataUrl,
  };

  const updated = dbService.attachProofAndSubmit(registrationId, fileMeta, transactionPhone);
  if (!updated) {
    fs.unlinkSync(file.path);
    res.status(404).json({ error: 'Inscription non trouvée.' });
    return;
  }

  res.json({
    success: true,
    registration: updated,
  });
});

// Get registration status
app.get('/api/registration/status/:id', (req: Request, res: Response) => {
  const record = dbService.getRegistrationById(req.params.id);
  if (!record) {
    res.status(404).json({ error: 'Inscription introuvable.' });
    return;
  }
  res.json({ registration: record });
});

// ==========================================
// ADMIN API
// ==========================================

// Check if initial admin account exists and quota info
app.get('/api/admin/check-setup', (_req: Request, res: Response) => {
  const hasAdmin = dbService.hasAdmins();
  const quota = dbService.getAdminQuotaInfo();
  res.json({
    hasAdmin,
    quota,
    currentCount: quota.currentCount,
    maxCount: quota.maxCount,
    canCreateAdmin: quota.canCreateAdmin,
  });
});

// Initial Setup (Only allowed if NO admins exist in database)
app.post('/api/admin/setup-initial', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 8) {
    res.status(400).json({ error: 'Email valide et mot de passe de 8 caractères minimum requis.' });
    return;
  }
  try {
    const adminUser = dbService.createFirstAdmin(email, password);
    const token = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '3650d' }
    );
    res.json({
      success: true,
      message: 'Compte Super Administrateur initial configuré avec succès.',
      token,
      user: adminUser,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Échec de la configuration initiale.' });
  }
});

// Admin Login (Permanent token 10 years / 3650 days)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email et mot de passe requis.' });
    return;
  }
  const adminUser = dbService.verifyAdmin(email, password);
  if (!adminUser) {
    res.status(401).json({ error: 'Identifiants invalides.' });
    return;
  }
  const token = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    JWT_SECRET,
    { expiresIn: '3650d' }
  );
  res.json({
    success: true,
    token,
    user: adminUser,
  });
});

// Admin Current User
app.get('/api/admin/me', requireAdminAuth, (req: AuthRequest, res: Response) => {
  res.json({ user: req.adminUser });
});

// Change own password
app.post('/api/admin/change-password', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
    return;
  }
  try {
    dbService.changePassword(req.adminUser!.id, oldPassword, newPassword);
    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors du changement de mot de passe.' });
  }
});

// List Admin Accounts + Quota
app.get('/api/admin/list', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const admins = dbService.getAdmins();
  const quota = dbService.getAdminQuotaInfo();
  res.json({ admins, quota });
});

// Create Admin Account (Only permitted if less than 2 admins exist)
app.post('/api/admin/create', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const quota = dbService.getAdminQuotaInfo();
  if (!quota.canCreateAdmin) {
    res.status(403).json({
      error:
        "Limite atteinte : Le quota maximal de 2 administrateurs (Super Administrateur + 1 administrateur) est déjà atteint. Aucune nouvelle inscription n'est autorisée. Seule la connexion des administrateurs est désormais permise.",
    });
    return;
  }

  const { email, tempPassword } = req.body;
  if (!email || !tempPassword || tempPassword.length < 8) {
    res.status(400).json({ error: 'Email valide et mot de passe temporaire (min. 8 car.) requis.' });
    return;
  }
  try {
    const newAdmin = dbService.createAdmin(email, tempPassword, req.adminUser!.role);
    const updatedQuota = dbService.getAdminQuotaInfo();
    res.json({ success: true, user: newAdmin, quota: updatedQuota });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la création du compte admin.' });
  }
});

// Delete Admin Account (Superadmin only, cannot delete superadmin)
app.delete('/api/admin/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  try {
    dbService.deleteAdmin(targetId, req.adminUser!.role, req.adminUser!.id);
    const quota = dbService.getAdminQuotaInfo();
    res.json({
      success: true,
      message: 'Compte administrateur supprimé avec succès.',
      quota,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la suppression du compte administrateur.' });
  }
});

// Update Admin Account (Superadmin can edit any admin; Admin can edit own account)
app.put('/api/admin/accounts/:id', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const targetId = req.params.id;
  const { email, password, role } = req.body;
  try {
    const updated = dbService.updateAdmin(
      targetId,
      { email, password, role },
      req.adminUser!.role,
      req.adminUser!.id
    );
    res.json({
      success: true,
      message: 'Compte administrateur mis à jour avec succès.',
      user: updated,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la modification du compte.' });
  }
});

// Get Form CMS Configuration (Admin)
app.get('/api/admin/form-config', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const config = dbService.getFormConfig();
  res.json({ config });
});

// Update Form CMS Configuration (Admin)
app.put('/api/admin/form-config', requireAdminAuth, (req: AuthRequest, res: Response) => {
  try {
    const payload = req.body.formConfig || req.body;
    const updatedConfig = dbService.updateFormConfig(payload);
    res.json({
      success: true,
      message: 'Configuration du formulaire enregistrée et publiée en direct avec succès.',
      config: updatedConfig,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la mise à jour de la configuration.' });
  }
});

// Upload CMS Asset (Header banner or logo)
app.post('/api/admin/upload-banner', requireAdminAuth, uploadBanner.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Aucun fichier image sélectionné.' });
    return;
  }
  const fileUrl = `/api/public/assets/${req.file.filename}`;
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
  });
});

// Public route to serve CMS assets (banners & logos)
app.get('/api/public/assets/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('Image non trouvée.');
    return;
  }
  res.sendFile(filePath);
});

// Reset Form Configuration to a specific template or default
app.post('/api/admin/form-config/reset', requireAdminAuth, (req: AuthRequest, res: Response) => {
  try {
    const { templateConfig } = req.body;
    const targetConfig = templateConfig || DEFAULT_FORM_CONFIG;
    const updatedConfig = dbService.updateFormConfig(targetConfig);
    res.json({
      success: true,
      message: 'Modèle de formulaire appliqué avec succès.',
      config: updatedConfig,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la réinitialisation du formulaire.' });
  }
});

// Reset Districts to Official Default 13 Districts (Admin)
app.post('/api/admin/form-config/reset-districts', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  try {
    const updatedConfig = dbService.updateFormConfig({
      districts: DEFAULT_OFFICIAL_DISTRICTS,
    });
    res.json({
      success: true,
      message: 'Liste des districts réinitialisée aux 13 districts officiels.',
      config: updatedConfig,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la réinitialisation des districts.' });
  }
});

// Get registrations with filters & analytics
app.get('/api/admin/registrations', requireAdminAuth, (req: Request, res: Response) => {
  const { search, club, district, status, paymentClickedOnly } = req.query;
  let list = dbService.getRegistrations();

  // Summary counts
  const total = list.length;
  const confirmed = list.filter((r) => r.status === 'confirmed').length;
  const pending = list.filter((r) => r.status === 'pending_verification').length;
  const paymentClickedPending = list.filter(
    (r) => r.paymentClicked && r.status !== 'confirmed' && r.status !== 'pending_verification'
  ).length;

  // Filter application
  if (paymentClickedOnly === 'true') {
    list = list.filter((r) => r.paymentClicked && r.status !== 'confirmed');
  }

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter((r) => r.status === status);
  }

  if (club && typeof club === 'string' && club !== 'all') {
    list = list.filter((r) => r.club === club);
  }

  if (district && typeof district === 'string' && district !== 'all') {
    list = list.filter((r) => r.district === district);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.contact.toLowerCase().includes(q) ||
        r.church.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }

  res.json({
    registrations: list,
    stats: {
      total,
      confirmed,
      pending,
      paymentClickedPending,
    },
  });
});

// Update registration status / notes
app.patch('/api/admin/registrations/:id', requireAdminAuth, (req: Request, res: Response) => {
  const { status, adminNotes } = req.body;
  if (!status || !['pending_verification', 'confirmed', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Statut invalide.' });
    return;
  }
  const updated = dbService.updateRegistrationStatus(req.params.id, status, adminNotes);
  if (!updated) {
    res.status(404).json({ error: 'Inscription non trouvée.' });
    return;
  }
  res.json({ success: true, registration: updated });
});

// Delete an individual registration permanently
app.delete('/api/admin/registrations/:id', requireAdminAuth, (req: Request, res: Response) => {
  const deleted = dbService.deleteRegistration(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Inscription introuvable ou déjà supprimée définitivement.' });
    return;
  }
  res.json({ success: true, message: 'Inscription supprimée définitivement avec succès.' });
});

// Batch Import Registrations (JSON & CSV imported records)
app.post('/api/admin/registrations/batch-import', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { registrations, options } = req.body;
    if (!registrations || !Array.isArray(registrations)) {
      res.status(400).json({ error: 'Tableau d’inscriptions requis pour l’importation.' });
      return;
    }

    if (registrations.length === 0) {
      res.status(400).json({ error: 'Aucune inscription fournie dans le fichier ou les données transmises.' });
      return;
    }

    const result = dbService.batchImportRegistrations(registrations, options);
    res.json({
      success: true,
      message: `${result.importedCount} nouvelle(s) inscription(s) ajoutée(s), ${result.updatedCount} mise(s) à jour.`,
      result,
    });
  } catch (err: any) {
    console.error('Error during batch import:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de l’importation des inscriptions.' });
  }
});

// Batch Sync Registrations from client-side persistent vault
app.post('/api/admin/registrations/batch-sync', requireAdminAuth, (req: Request, res: Response) => {
  try {
    const { registrations } = req.body;
    if (!registrations || !Array.isArray(registrations)) {
      res.status(400).json({ error: 'Données de synchronisation invalides.' });
      return;
    }

    const result = dbService.batchSyncRegistrations(registrations);
    res.json({
      success: true,
      message: `${result.syncedCount} inscription(s) resynchronisée(s) avec succès.`,
      result,
    });
  } catch (err: any) {
    console.error('Error during batch sync:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la resynchronisation.' });
  }
});

// Reset all registrations and counters to zero
app.post('/api/admin/registrations/reset', requireAdminAuth, (_req: Request, res: Response) => {
  const result = dbService.resetAllRegistrations();
  res.json({
    success: true,
    deletedCount: result.deletedCount,
    message: 'Toutes les inscriptions et compteurs ont été réinitialisés à zéro.',
  });
});

// Get admin settings
app.get('/api/admin/settings', requireAdminAuth, (_req: Request, res: Response) => {
  const settings = dbService.getSettings();
  res.json({ settings });
});

// Update admin settings (Wave link, amounts, recipient)
app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  const current = dbService.getSettings();
  const {
    waveLink,
    waveRecipientName,
    waveNumber,
    paymentAmount,
    generalInstructions,
    momoNumber,
    momoRecipientName,
    eventName,
    eventDate,
    eventLocation,
  } = req.body;

  const updated = dbService.updateSettings({
    waveLink: waveLink !== undefined ? String(waveLink).trim() : current.waveLink,
    waveRecipientName: waveRecipientName !== undefined ? String(waveRecipientName).trim() : (momoRecipientName || current.waveRecipientName),
    waveNumber: '0769343626',
    paymentAmount: paymentAmount !== undefined ? String(paymentAmount).trim() : current.paymentAmount,
    generalInstructions: generalInstructions !== undefined ? String(generalInstructions).trim() : current.generalInstructions,
    eventName: eventName !== undefined ? String(eventName).trim() : current.eventName,
    eventDate: eventDate !== undefined ? String(eventDate).trim() : current.eventDate,
    eventLocation: eventLocation !== undefined ? String(eventLocation).trim() : current.eventLocation,
    // Sync permanent numbers
    momoNumber: '0769343626',
    momoRecipientName: waveRecipientName !== undefined ? String(waveRecipientName).trim() : (momoRecipientName || current.waveRecipientName),
    orangeMoneyLink: '',
    mtnMoMoLink: '',
  });
  res.json({ success: true, settings: updated });
});

// Full Database Backup Download (Permanent archives)
app.get('/api/admin/backup-download', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const fullBackup = dbService.getDatabaseBackup();
  // Sanitize password hashes for safety in exported JSON
  const safeData = {
    ...fullBackup,
    admins: fullBackup.admins.map(({ passwordHash: _, ...safe }) => safe),
    exportedAt: new Date().toISOString(),
    system: 'Randonnée Banco 2026 - Système Permanent d’Archivage',
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="sauvegarde-permanente-randonnee-banco-${new Date().toISOString().slice(0, 10)}.json"`
  );
  res.send(JSON.stringify(safeData, null, 2));
});

// Restore Database from JSON Backup (Superadmin only)
app.post('/api/admin/backup-restore', requireAdminAuth, (req: AuthRequest, res: Response) => {
  if (req.adminUser?.role !== 'superadmin') {
    res.status(403).json({ error: 'Seul le Super Administrateur peut restaurer une sauvegarde globale.' });
    return;
  }
  const { backupData } = req.body;
  if (!backupData || (!backupData.registrations && !backupData.settings)) {
    res.status(400).json({ error: 'Format de fichier de sauvegarde invalide.' });
    return;
  }
  try {
    const result = dbService.restoreDatabaseBackup(backupData);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la restauration.' });
  }
});

// Sync data from live published URL into current db.json before republishing
app.post('/api/admin/sync-from-production', requireAdminAuth, async (req: AuthRequest, res: Response) => {
  const { productionUrl, prodEmail, prodPassword, prodToken, secondAdminPassword } = req.body;
  const targetUrl = (productionUrl || 'https://randonnee-ja-2026.ai.studio').replace(/\/+$/, '');

  let authToken = prodToken;

  if (!authToken) {
    if (!prodEmail || !prodPassword) {
      res.status(400).json({ error: 'Email et mot de passe de la version publiée requis pour la synchronisation.' });
      return;
    }
    try {
      const loginRes = await fetch(`${targetUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: prodEmail, password: prodPassword }),
      });
      const loginData: any = await loginRes.json();
      if (!loginRes.ok || !loginData.token) {
        res.status(401).json({ error: loginData.error || 'Échec de connexion au site publié. Vérifiez vos identifiants.' });
        return;
      }
      authToken = loginData.token;
    } catch (err: any) {
      res.status(502).json({ error: 'Impossible de joindre le site en ligne : ' + err.message });
      return;
    }
  }

  try {
    // 1. Fetch live registrations
    const regRes = await fetch(`${targetUrl}/api/admin/registrations`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (!regRes.ok) {
      res.status(502).json({ error: 'Impossible de récupérer les inscriptions depuis le site en ligne.' });
      return;
    }
    const regData: any = await regRes.json();
    const liveRegistrations = regData.registrations || [];

    // 2. Fetch live admins
    const adminRes = await fetch(`${targetUrl}/api/admin/list`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    let liveAdmins: any[] = [];
    if (adminRes.ok) {
      const adminData: any = await adminRes.json();
      liveAdmins = adminData.admins || [];
    }

    // 3. Fetch live settings
    const setRes = await fetch(`${targetUrl}/api/settings`);
    let liveSettings: any = {};
    if (setRes.ok) {
      liveSettings = await setRes.json();
    }

    const syncResult = dbService.syncFromProductionData({
      registrations: liveRegistrations,
      admins: liveAdmins,
      settings: liveSettings,
      secondAdminPassword,
    });

    res.json({
      success: true,
      message: `Synchronisation réussie ! ${syncResult.syncedRegistrationsCount} inscriptions et ${syncResult.syncedAdminsCount} administrateurs ont été importés dans votre espace de travail. Vous pouvez maintenant republier sans rien perdre.`,
      result: syncResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erreur lors de la synchronisation : ' + err.message });
  }
});

// Secure proof delivery (requires valid admin auth token in header or query)
app.get('/api/admin/proofs/:filename', (req: Request, res: Response) => {
  const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Accès sécurisé refusé. Token requis.' });
    return;
  }
  try {
    jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Session non autorisée.' });
    return;
  }

  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    // Attempt automatic reconstruction from permanent dataUrl if container storage was reset
    const reg = dbService.getRegistrations().find((r) => r.proofFile?.filename === filename);
    if (reg?.proofFile?.dataUrl) {
      try {
        const matches = reg.proofFile.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, buffer);
          res.sendFile(filePath);
          return;
        }
      } catch (e) {
        console.warn('Could not reconstruct file from dataUrl:', e);
      }
    }
    res.status(404).json({ error: 'Fichier de preuve introuvable.' });
    return;
  }

  res.sendFile(filePath);
});

// Direct Web View of payment proof by registration reference or filename (for exported documents PDF, Excel, CSV, JSON)
app.get('/api/proofs/view/:id', (req: Request, res: Response) => {
  const targetId = (req.params.id || '').trim();
  const list = dbService.getRegistrations();
  const reg = list.find(
    (r) => r.id.toLowerCase() === targetId.toLowerCase() || r.proofFile?.filename === targetId
  );

  if (!reg) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Preuve introuvable</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f2ed;color:#383827;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box;">
        <div style="background:#fff;padding:32px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:440px;width:100%;text-align:center;">
          <h2 style="color:#D2691E;margin-top:0;">Dossier introuvable</h2>
          <p style="color:#666;font-size:14px;line-height:1.6;">La référence <code>${targetId}</code> ne correspond à aucune inscription enregistrée.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (!reg.proofFile) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Aucune preuve transmise</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family:system-ui,-apple-system,sans-serif;background:#f5f2ed;color:#383827;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;box-sizing:border-box;">
        <div style="background:#fff;padding:32px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);max-width:480px;width:100%;text-align:center;">
          <div style="display:inline-block;padding:8px 14px;background:#fef3c7;color:#92400e;border-radius:999px;font-weight:bold;font-size:12px;margin-bottom:12px;">En attente de preuve</div>
          <h2 style="color:#5A5A40;margin-top:0;">Aucune preuve de paiement jointe</h2>
          <p style="color:#555;font-size:14px;line-height:1.5;">Le participant <strong>${reg.fullName || 'Non renseigné'}</strong> (Réf : <code>${reg.id}</code>) n'a pas encore téléversé de reçu ou capture de paiement.</p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  const filename = path.basename(reg.proofFile.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  // 1. Try serving from disk
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', reg.proofFile.mimeType || 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="${reg.proofFile.originalName}"`);
    res.sendFile(filePath);
    return;
  }

  // 2. Try reconstructing from dataUrl
  if (reg.proofFile.dataUrl) {
    try {
      const matches = reg.proofFile.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        try {
          fs.writeFileSync(filePath, buffer);
        } catch {}
        res.setHeader('Content-Type', matches[1]);
        res.setHeader('Content-Disposition', `inline; filename="${reg.proofFile.originalName}"`);
        res.send(buffer);
        return;
      }
    } catch (e) {
      console.warn('Could not reconstruct file from dataUrl:', e);
    }
  }

  res.status(404).send('Fichier de preuve physique temporairement indisponible.');
});

// Download endpoint for payment proof
app.get('/api/proofs/download/:id', (req: Request, res: Response) => {
  const targetId = (req.params.id || '').trim();
  const list = dbService.getRegistrations();
  const reg = list.find(
    (r) => r.id.toLowerCase() === targetId.toLowerCase() || r.proofFile?.filename === targetId
  );

  if (!reg || !reg.proofFile) {
    res.status(404).send('Preuve introuvable.');
    return;
  }

  const filename = path.basename(reg.proofFile.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, reg.proofFile.originalName);
    return;
  }

  if (reg.proofFile.dataUrl) {
    try {
      const matches = reg.proofFile.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        res.setHeader('Content-Type', matches[1]);
        res.setHeader('Content-Disposition', `attachment; filename="${reg.proofFile.originalName}"`);
        res.send(buffer);
        return;
      }
    } catch {}
  }

  res.status(404).send('Fichier introuvable.');
});

// Full update of a participant registration by admin
app.put('/api/admin/registrations/:id', requireAdminAuth, (req: Request, res: Response) => {
  const updated = dbService.updateRegistration(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Inscription introuvable.' });
    return;
  }
  res.json({ success: true, registration: updated });
});

// Cloud Firestore Status & Synchronize endpoints
app.get('/api/admin/cloud-status', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const status = dbService.getCloudSyncStatus();
  res.json({ success: true, status });
});

app.post('/api/admin/cloud-sync', requireAdminAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const result = await dbService.syncCloudNow();
    res.json({ success: result.success, message: result.message, count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Erreur lors de la synchronisation Cloud' });
  }
});

// Export CSV with UTF-8 BOM
app.get('/api/admin/export-csv', requireAdminAuth, (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  const list = dbService.getRegistrations();
  
  const headers = [
    'Référence',
    'Date Inscription',
    'Nom & Prénoms',
    'Église',
    'Contact',
    'Numéro Transaction',
    'District',
    'Club',
    'Taille T-Shirt',
    'Maladie/Allergie',
    'Détails Maladie',
    'Champs Personnalisés',
    'Statut Inscription',
    'Clic Lien Paiement',
    'Date Clic Paiement',
    'Preuve Transmise',
    'Nom Fichier Preuve',
    'Lien Preuve Web',
    'Lien Téléchargement Preuve',
    'Notes Admin'
  ];

  const rows = list.map((r) => [
    `"${r.id}"`,
    `"${r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : ''}"`,
    `"${(r.fullName || '').replace(/"/g, '""')}"`,
    `"${(r.church || '').replace(/"/g, '""')}"`,
    `"${(r.contact || '').replace(/"/g, '""')}"`,
    `"${(r.transactionPhone || '').replace(/"/g, '""')}"`,
    `"${r.district === 'Autre' ? (r.districtOther || 'Autre') : (r.district || '')}"`,
    `"${r.club === 'Autre' ? (r.clubOther || 'Autre') : (r.club || '')}"`,
    `"${r.tshirtSize === 'Autre' ? (r.tshirtSizeOther || 'Autre') : (r.tshirtSize || 'Non spécifié')}"`,
    `"${r.hasIllness}"`,
    `"${(r.illnessDetails || '').replace(/"/g, '""')}"`,
    `"${r.customFields ? Object.entries(r.customFields).map(([k, v]) => `${k}: ${v}`).join(' | ').replace(/"/g, '""') : ''}"`,
    `"${r.status === 'confirmed' ? 'Confirmé' : r.status === 'pending_verification' ? 'En attente vérification' : r.status === 'rejected' ? 'Rejeté' : r.paymentClicked ? 'Paiement cliqué non soumis' : 'Brouillon'}"`,
    `"${r.paymentClicked ? 'OUI' : 'NON'}"`,
    `"${r.paymentClickedAt ? new Date(r.paymentClickedAt).toLocaleString('fr-FR') : ''}"`,
    `"${r.proofFile ? 'OUI' : 'NON'}"`,
    `"${r.proofFile ? r.proofFile.originalName.replace(/"/g, '""') : 'Aucune'}"`,
    `"${r.proofFile ? `${baseUrl}/api/proofs/view/${r.id}` : ''}"`,
    `"${r.proofFile ? `${baseUrl}/api/proofs/download/${r.id}` : ''}"`,
    `"${(r.adminNotes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  const filename = `inscriptions-randonnee-2026-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// Export Excel (.xlsx) with clean formatting, auto column widths and proof links
app.get('/api/admin/export-excel', requireAdminAuth, (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  const list = dbService.getRegistrations();

  const tableData = list.map((r, index) => ({
    'N°': index + 1,
    'Référence': r.id,
    "Date d'inscription": r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '',
    'Nom & Prénoms': r.fullName || '',
    'Église locale': r.church || '',
    'Téléphone / Contact': r.contact || '',
    'Numéro Transaction': r.transactionPhone || '',
    'District': r.district === 'Autre' ? (r.districtOther || 'Autre') : (r.district || ''),
    'Club JA': r.club === 'Autre' ? (r.clubOther || 'Autre') : (r.club || ''),
    'Taille T-Shirt': r.tshirtSize === 'Autre' ? (r.tshirtSizeOther || 'Autre') : (r.tshirtSize || 'Non spécifié'),
    'Affections / Santé': r.hasIllness === 'Oui' ? 'OUI' : 'NON',
    'Détails Médicaux': r.illnessDetails || 'Aucun',
    "Statut de l'inscription":
      r.status === 'confirmed'
        ? 'Confirmé (Paiement validé)'
        : r.status === 'pending_verification'
        ? 'En attente de vérification'
        : r.status === 'rejected'
        ? 'Rejeté'
        : r.paymentClicked
        ? 'Lien cliqué (Preuve non reçue)'
        : 'Brouillon',
    'Preuve jointe': r.proofFile ? 'OUI' : 'NON',
    'Fichier de preuve': r.proofFile ? r.proofFile.originalName : 'Aucun',
    'Lien pour voir la preuve': r.proofFile ? `${baseUrl}/api/proofs/view/${r.id}` : 'Aucune preuve',
    'Lien de téléchargement': r.proofFile ? `${baseUrl}/api/proofs/download/${r.id}` : '-',
    'Date clic paiement': r.paymentClickedAt ? new Date(r.paymentClickedAt).toLocaleString('fr-FR') : '-',
    'Notes Administrateur': r.adminNotes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(tableData);

  // Auto column widths
  if (tableData.length > 0) {
    const colWidths = Object.keys(tableData[0]).map((key) => {
      let maxLen = key.length;
      tableData.forEach((row) => {
        const val = (row as any)[key] ? String((row as any)[key]) : '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(Math.max(maxLen + 3, 11), 50) };
    });
    ws['!cols'] = colWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions');

  // Summary sheet
  const total = list.length;
  const confirmed = list.filter((r) => r.status === 'confirmed').length;
  const pending = list.filter((r) => r.status === 'pending_verification').length;
  const withProof = list.filter((r) => !!r.proofFile).length;
  const withIllness = list.filter((r) => r.hasIllness === 'Oui').length;

  const summaryData = [
    { 'Propriété / Indicateur': 'Événement', 'Valeur': 'Randonnée Forêt du Banco 2026' },
    { 'Propriété / Indicateur': 'Date de la Randonnée', 'Valeur': 'Dimanche 15 Novembre 2026' },
    { 'Propriété / Indicateur': 'Lieu', 'Valeur': 'Parc National du Banco, Abidjan' },
    { 'Propriété / Indicateur': "Date d'exportation", 'Valeur': new Date().toLocaleString('fr-FR') },
    { 'Propriété / Indicateur': 'Total des participants inscrits', 'Valeur': total },
    { 'Propriété / Indicateur': 'Inscriptions Confirmées (Validées)', 'Valeur': confirmed },
    { 'Propriété / Indicateur': 'Inscriptions En Attente de Vérification', 'Valeur': pending },
    { 'Propriété / Indicateur': 'Dossiers avec Preuve de Paiement Reçue', 'Valeur': withProof },
    { 'Propriété / Indicateur': 'Participants avec Affection Médicale', 'Valeur': withIllness },
  ];
  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 45 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Synthèse Officielle');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const filename = `registre-inscriptions-randonnee-2026-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

// Export JSON (.json) complete with proof metadata, view links, and download links
app.get('/api/admin/export-json', requireAdminAuth, (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  const list = dbService.getRegistrations();

  const exportPayload = {
    metadata: {
      event: 'Randonnée Forêt du Banco 2026',
      edition: 'Édition 2026 - Ministère de la Jeunesse Adventiste',
      date: 'Dimanche 15 Novembre 2026',
      lieu: 'Parc National du Banco, Abidjan, Côte d’Ivoire',
      exportedAt: new Date().toISOString(),
      totalRegistrations: list.length,
      confirmedCount: list.filter((r) => r.status === 'confirmed').length,
      pendingCount: list.filter((r) => r.status === 'pending_verification').length,
      rejectedCount: list.filter((r) => r.status === 'rejected').length,
      withProofCount: list.filter((r) => !!r.proofFile).length,
    },
    registrations: list.map((r) => ({
      ...r,
      proofFile: r.proofFile
        ? {
            filename: r.proofFile.filename,
            originalName: r.proofFile.originalName,
            mimeType: r.proofFile.mimeType,
            size: r.proofFile.size,
            uploadedAt: r.proofFile.uploadedAt,
            hasDataUrl: !!r.proofFile.dataUrl,
            dataUrl: r.proofFile.dataUrl || null,
            viewUrl: `${baseUrl}/api/proofs/view/${r.id}`,
            downloadUrl: `${baseUrl}/api/proofs/download/${r.id}`,
          }
        : null,
    })),
  };

  const filename = `inscriptions-randonnee-2026-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

// Friendly aliases for simplified form links
app.get(['/inscription', '/banco2026', '/banco', '/formulaire'], (_req: Request, _res: Response, next) => {
  next();
});

// ==========================================
// VITE OR STATIC SERVING
// ==========================================
async function startServer() {
  // Initialize Cloud Firestore persistence in background
  dbService.initCloudPersistence().then((res) => {
    console.log('[Cloud Persistence] Initial boot sync:', res.message, `(${res.registrationCount} inscriptions actives)`);
  }).catch((err) => {
    console.warn('[Cloud Persistence] Initial boot sync warning:', err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Randonnée 2026 application running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Startup error:', err);
  process.exit(1);
});
