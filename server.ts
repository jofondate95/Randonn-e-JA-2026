import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { dbService, initializeAdminFromEnv } from './server/db.js';

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

// Get public settings (payment details, event info)
app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = dbService.getSettings();
  res.json({
    momoNumber: settings.momoNumber,
    momoRecipientName: settings.momoRecipientName,
    paymentAmount: settings.paymentAmount,
    waveLink: settings.waveLink,
    orangeMoneyLink: settings.orangeMoneyLink,
    mtnMoMoLink: settings.mtnMoMoLink,
    generalInstructions: settings.generalInstructions,
    eventDate: settings.eventDate,
    eventLocation: settings.eventLocation,
    eventName: settings.eventName,
  });
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

  // Basic validations
  if (!formData.fullName || formData.fullName.trim().length < 3) {
    res.status(400).json({ error: 'Le Nom et Prénoms sont obligatoires (au moins 3 caractères).' });
    return;
  }
  if (!formData.church || formData.church.trim().length < 2) {
    res.status(400).json({ error: "L'église d'appartenance est obligatoire." });
    return;
  }
  if (!formData.contact || formData.contact.trim().length < 8) {
    res.status(400).json({ error: 'Un numéro de contact valide (+225) est obligatoire.' });
    return;
  }
  if (!formData.district) {
    res.status(400).json({ error: 'Le District est obligatoire.' });
    return;
  }
  if (formData.district === 'Autre' && !formData.districtOther?.trim()) {
    res.status(400).json({ error: 'Veuillez préciser votre District.' });
    return;
  }
  if (!formData.club) {
    res.status(400).json({ error: 'Le Club est obligatoire.' });
    return;
  }
  if (formData.club === 'Autre' && !formData.clubOther?.trim()) {
    res.status(400).json({ error: 'Veuillez préciser votre Club.' });
    return;
  }
  if (formData.hasIllness === 'Oui' && !formData.illnessDetails?.trim()) {
    res.status(400).json({ error: 'Veuillez préciser la nature de votre maladie ou allergie.' });
    return;
  }

  // Anti-duplicate phone check
  const isDuplicate = dbService.checkDuplicateContact(formData.contact, registrationId);
  if (isDuplicate) {
    res.status(409).json({
      error: 'Une inscription avec ce numéro de contact est déjà enregistrée ou en cours de vérification.',
    });
    return;
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

  const fileMeta = {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };

  const updated = dbService.attachProofAndSubmit(registrationId, fileMeta);
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

// Check if initial admin account exists
app.get('/api/admin/check-setup', (_req: Request, res: Response) => {
  const hasAdmin = dbService.hasAdmins();
  res.json({ hasAdmin });
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
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      message: 'Compte administrateur initial configuré avec succès.',
      token,
      user: adminUser,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Échec de la configuration initiale.' });
  }
});

// Admin Login
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
    { expiresIn: '8h' }
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

// List Admin Accounts
app.get('/api/admin/list', requireAdminAuth, (_req: AuthRequest, res: Response) => {
  const admins = dbService.getAdmins();
  res.json({ admins });
});

// Create Admin Account (only logged-in admins can invite/create new admins)
app.post('/api/admin/create', requireAdminAuth, (req: AuthRequest, res: Response) => {
  const { email, tempPassword } = req.body;
  if (!email || !tempPassword || tempPassword.length < 8) {
    res.status(400).json({ error: 'Email valide et mot de passe temporaire (min. 8 car.) requis.' });
    return;
  }
  try {
    const newAdmin = dbService.createAdmin(email, tempPassword, req.adminUser!.role);
    res.json({ success: true, user: newAdmin });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erreur lors de la création du compte admin.' });
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

// Get admin settings
app.get('/api/admin/settings', requireAdminAuth, (_req: Request, res: Response) => {
  const settings = dbService.getSettings();
  res.json({ settings });
});

// Update admin settings (momo number, links, amounts)
app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
  const { momoNumber, momoRecipientName, paymentAmount, waveLink, orangeMoneyLink, mtnMoMoLink, generalInstructions } = req.body;
  const updated = dbService.updateSettings({
    momoNumber,
    momoRecipientName,
    paymentAmount,
    waveLink,
    orangeMoneyLink,
    mtnMoMoLink,
    generalInstructions,
  });
  res.json({ success: true, settings: updated });
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
    res.status(404).json({ error: 'Fichier de preuve introuvable.' });
    return;
  }

  res.sendFile(filePath);
});

// Export CSV with UTF-8 BOM
app.get('/api/admin/export-csv', requireAdminAuth, (_req: Request, res: Response) => {
  const list = dbService.getRegistrations();
  
  const headers = [
    'Référence',
    'Date Inscription',
    'Nom & Prénoms',
    'Église',
    'Contact',
    'District',
    'Club',
    'Taille T-Shirt',
    'Maladie/Allergie',
    'Détails Maladie',
    'Statut Inscription',
    'Clic Lien Paiement',
    'Date Clic Paiement',
    'Preuve Uploadee',
    'Notes Admin'
  ];

  const rows = list.map((r) => [
    `"${r.id}"`,
    `"${r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : ''}"`,
    `"${(r.fullName || '').replace(/"/g, '""')}"`,
    `"${(r.church || '').replace(/"/g, '""')}"`,
    `"${(r.contact || '').replace(/"/g, '""')}"`,
    `"${r.district === 'Autre' ? (r.districtOther || 'Autre') : (r.district || '')}"`,
    `"${r.club === 'Autre' ? (r.clubOther || 'Autre') : (r.club || '')}"`,
    `"${r.tshirtSize === 'Autre' ? (r.tshirtSizeOther || 'Autre') : (r.tshirtSize || 'Non spécifié')}"`,
    `"${r.hasIllness}"`,
    `"${(r.illnessDetails || '').replace(/"/g, '""')}"`,
    `"${r.status === 'confirmed' ? 'Confirmé' : r.status === 'pending_verification' ? 'En attente vérification' : r.status === 'rejected' ? 'Rejeté' : r.paymentClicked ? 'Paiement cliqué non soumis' : 'Brouillon'}"`,
    `"${r.paymentClicked ? 'OUI' : 'NON'}"`,
    `"${r.paymentClickedAt ? new Date(r.paymentClickedAt).toLocaleString('fr-FR') : ''}"`,
    `"${r.proofFile ? r.proofFile.originalName : 'Aucune'}"`,
    `"${(r.adminNotes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  const filename = `inscriptions-randonnee-2026-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// Export Excel (.xlsx) with clean formatting & auto column widths
app.get('/api/admin/export-excel', requireAdminAuth, (_req: Request, res: Response) => {
  const list = dbService.getRegistrations();

  const tableData = list.map((r, index) => ({
    'N°': index + 1,
    'Référence': r.id,
    "Date d'inscription": r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '',
    'Nom & Prénoms': r.fullName || '',
    'Église locale': r.church || '',
    'Téléphone / Contact': r.contact || '',
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
      return { wch: Math.min(Math.max(maxLen + 3, 11), 45) };
    });
    ws['!cols'] = colWidths;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inscriptions');

  // Summary sheet
  const total = list.length;
  const confirmed = list.filter((r) => r.status === 'confirmed').length;
  const pending = list.filter((r) => r.status === 'pending_verification').length;
  const withIllness = list.filter((r) => r.hasIllness === 'Oui').length;

  const summaryData = [
    { 'Propriété / Indicateur': 'Événement', 'Valeur': 'Randonnée Forêt du Banco 2026' },
    { 'Propriété / Indicateur': 'Date de la Randonnée', 'Valeur': 'Dimanche 15 Novembre 2026' },
    { 'Propriété / Indicateur': 'Lieu', 'Valeur': 'Parc National du Banco, Abidjan' },
    { 'Propriété / Indicateur': "Date d'exportation", 'Valeur': new Date().toLocaleString('fr-FR') },
    { 'Propriété / Indicateur': 'Total des participants inscrits', 'Valeur': total },
    { 'Propriété / Indicateur': 'Inscriptions Confirmées (Validées)', 'Valeur': confirmed },
    { 'Propriété / Indicateur': 'Inscriptions En Attente de Vérification', 'Valeur': pending },
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

// ==========================================
// VITE OR STATIC SERVING
// ==========================================
async function startServer() {
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
