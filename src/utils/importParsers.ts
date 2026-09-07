import * as XLSX from 'xlsx';
import { RegistrationRecord, ClubType, TshirtSize, RegistrationStatus } from '../types.js';

export interface ParsedRow {
  rowNumber: number;
  originalData: Record<string, any>;
  record: Partial<RegistrationRecord>;
  warnings: string[];
  isValid: boolean;
  isDuplicateWithExisting?: boolean;
}

export interface ParsedImportResult {
  fileName: string;
  totalRows: number;
  validCount: number;
  warningCount: number;
  rows: ParsedRow[];
  detectedColumns: string[];
  format: 'csv' | 'json' | 'excel';
}

/**
 * Standardize text key for resilient column matching
 */
function normalizeColumnName(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Map header fields to standard RegistrationRecord keys
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  fullName: ['nom', 'nometprenoms', 'nomprenoms', 'nomcomplet', 'fullname', 'participant', 'prenom', 'identite'],
  contact: ['contact', 'telephone', 'tel', 'phone', 'whatsapp', 'mobile', 'numero', 'numerotelephone'],
  church: ['eglise', 'egliselocale', 'paroisse', 'temple', 'communaute', 'church', 'assemblee'],
  district: ['district', 'zone', 'region'],
  club: ['club', 'categorie', 'section', 'branche', 'groupe'],
  tshirtSize: ['tailleteeshirt', 'tailletshirt', 'taille', 'teeshirt', 'tshirt', 'tshirtsize'],
  hasIllness: ['maladie', 'allergie', 'antecedents', 'antecedentsmedicaux', 'hasillness', 'problemesante'],
  illnessDetails: ['detailsmaladie', 'precisions', 'precisionmaladie', 'details', 'illnessdetails', 'allergiesdetails'],
  status: ['statut', 'etat', 'status', 'statutpaiement'],
  adminNotes: ['notes', 'commentaire', 'commentaires', 'remarques', 'adminnotes'],
  transactionPhone: ['numerotransaction', 'numerowave', 'telwave', 'transactionphone'],
};

function matchColumn(header: string): string | null {
  const normalized = normalizeColumnName(header);
  for (const [targetKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(normalized)) {
      return targetKey;
    }
  }
  return null;
}

/**
 * Normalize and clean phone numbers
 */
export function cleanPhoneNumber(phone: any): string {
  if (!phone) return '';
  const str = String(phone).trim();
  return str.replace(/\s+/g, ' ');
}

/**
 * Normalize Club value
 */
function normalizeClub(val: any): ClubType {
  if (!val) return 'Aventurier';
  const str = String(val).trim().toLowerCase();
  if (str.includes('eclaireur') || str.includes('éclaireur')) return 'Éclaireur';
  if (str.includes('ambassadeur')) return 'Ambassadeur';
  if (str.includes('aine') || str.includes('aîné') || str.includes('adulte')) return 'Aîné';
  if (str.includes('guide') || str.includes('cadre')) return 'Chef Guide';
  if (str.includes('leader') || str.includes('responsable')) return 'Leader de Jeunesse';
  if (str.includes('aventurier') || str.includes('enfant')) return 'Aventurier';
  return 'Autre';
}

/**
 * Normalize Tshirt Size
 */
function normalizeTshirt(val: any): TshirtSize {
  if (!val) return 'M';
  const str = String(val).trim().toUpperCase();
  if (['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(str)) return str as TshirtSize;
  return 'M';
}

/**
 * Normalize Status
 */
function normalizeStatus(val: any, defaultStatus: RegistrationStatus = 'confirmed'): RegistrationStatus {
  if (!val) return defaultStatus;
  const str = String(val).trim().toLowerCase();
  if (str.includes('confirm') || str.includes('valid') || str.includes('paye') || str.includes('ok')) return 'confirmed';
  if (str.includes('attente') || str.includes('pending') || str.includes('verif')) return 'pending_verification';
  if (str.includes('clic') || str.includes('wave')) return 'payment_clicked';
  if (str.includes('brouillon') || str.includes('draft')) return 'draft';
  if (str.includes('rejet') || str.includes('refus')) return 'rejected';
  return defaultStatus;
}

/**
 * Parse an uploaded file (CSV, JSON, or Excel)
 */
export async function parseImportFile(
  file: File,
  existingRegistrations: RegistrationRecord[] = [],
  defaultStatus: RegistrationStatus = 'confirmed'
): Promise<ParsedImportResult> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.json')) {
    const text = await file.text();
    return parseJsonText(text, fileName, existingRegistrations, defaultStatus);
  }

  // Excel or CSV file via XLSX library
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return processRawRows(rawRows, fileName, lowerName.endsWith('.csv') ? 'csv' : 'excel', existingRegistrations, defaultStatus);
}

/**
 * Parse raw text pasted directly into textarea (auto-detects JSON or CSV)
 */
export function parseImportText(
  text: string,
  existingRegistrations: RegistrationRecord[] = [],
  defaultStatus: RegistrationStatus = 'confirmed'
): ParsedImportResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      fileName: 'Texte collé',
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      rows: [],
      detectedColumns: [],
      format: 'csv',
    };
  }

  // Check if JSON format
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return parseJsonText(trimmed, 'Données JSON', existingRegistrations, defaultStatus);
    } catch {
      // fallback to CSV parsing if JSON fails
    }
  }

  // CSV parsing via XLSX
  const workbook = XLSX.read(trimmed, { type: 'string' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
  return processRawRows(rawRows, 'Texte CSV collé', 'csv', existingRegistrations, defaultStatus);
}

/**
 * Internal helper for JSON string parsing
 */
function parseJsonText(
  text: string,
  sourceName: string,
  existingRegistrations: RegistrationRecord[],
  defaultStatus: RegistrationStatus
): ParsedImportResult {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err: any) {
    throw new Error(`Format JSON invalide : ${err.message}`);
  }

  let arrayData: any[] = [];
  if (Array.isArray(parsed)) {
    arrayData = parsed;
  } else if (parsed && typeof parsed === 'object') {
    if (Array.isArray(parsed.registrations)) {
      arrayData = parsed.registrations;
    } else if (Array.isArray(parsed.data)) {
      arrayData = parsed.data;
    } else if (Array.isArray(parsed.inscrits)) {
      arrayData = parsed.inscrits;
    } else {
      // Single object
      arrayData = [parsed];
    }
  }

  return processRawRows(arrayData, sourceName, 'json', existingRegistrations, defaultStatus);
}

/**
 * Process raw row objects into normalized ParsedRow array
 */
function processRawRows(
  rawRows: Record<string, any>[],
  fileName: string,
  format: 'csv' | 'json' | 'excel',
  existingRegistrations: RegistrationRecord[],
  defaultStatus: RegistrationStatus
): ParsedImportResult {
  const existingPhones = new Set<string>();
  const existingNames = new Set<string>();
  for (const r of existingRegistrations) {
    if (r.contact) {
      existingPhones.add(r.contact.replace(/\s+/g, '').replace(/[^\d+]/g, ''));
    }
    if (r.fullName) {
      existingNames.add(r.fullName.trim().toLowerCase());
    }
  }

  const detectedHeaders = new Set<string>();
  const rows: ParsedRow[] = [];
  let validCount = 0;
  let warningCount = 0;

  rawRows.forEach((raw, idx) => {
    const rowNumber = idx + 1;
    const warnings: string[] = [];
    const normalizedData: Record<string, any> = {};

    // Map each raw key to standard key
    for (const [key, value] of Object.entries(raw)) {
      detectedHeaders.add(key);
      const matchedKey = matchColumn(key);
      if (matchedKey) {
        normalizedData[matchedKey] = value;
      } else {
        normalizedData[key] = value;
      }
    }

    // Extraction & normalisation
    const fullName = String(normalizedData.fullName || normalizedData.nom || normalizedData.name || '').trim();
    const contact = cleanPhoneNumber(normalizedData.contact || normalizedData.telephone || normalizedData.phone || '');
    const church = String(normalizedData.church || normalizedData.eglise || 'Non spécifiée').trim();
    const district = String(normalizedData.district || 'District du Phare').trim();
    const club = normalizeClub(normalizedData.club);
    const tshirtSize = normalizeTshirt(normalizedData.tshirtSize);
    const rawHasIllness = normalizedData.hasIllness;
    const hasIllness = (rawHasIllness === 'Oui' || rawHasIllness === 'true' || rawHasIllness === true || rawHasIllness === 'oui') ? 'Oui' : 'Non';
    const illnessDetails = String(normalizedData.illnessDetails || '').trim();
    const status = normalizeStatus(normalizedData.status, defaultStatus);
    const adminNotes = String(normalizedData.adminNotes || `Importé depuis ${fileName}`).trim();
    const transactionPhone = cleanPhoneNumber(normalizedData.transactionPhone || '');

    if (!fullName) {
      warnings.push('Nom et Prénoms manquants.');
    }
    if (!contact) {
      warnings.push('Numéro de contact manquant (complété par défaut).');
    }

    // Check duplicate
    const cleanPhone = contact.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    const isPhoneDuplicate = cleanPhone && existingPhones.has(cleanPhone);
    const isNameDuplicate = fullName && existingNames.has(fullName.toLowerCase());
    const isDuplicateWithExisting = Boolean(isPhoneDuplicate || isNameDuplicate);

    if (isDuplicateWithExisting) {
      warnings.push(isPhoneDuplicate ? 'Numéro de téléphone déjà présent dans la base.' : 'Nom déjà présent dans la base.');
    }

    const isValid = Boolean(fullName && fullName.length >= 2);
    if (isValid) {
      validCount++;
    }
    if (warnings.length > 0) {
      warningCount++;
    }

    const record: Partial<RegistrationRecord> = {
      id: normalizedData.id && String(normalizedData.id).startsWith('BANCO-2026-')
        ? String(normalizedData.id)
        : `BANCO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sessionId: normalizedData.sessionId || `import_${Date.now()}_${idx}`,
      fullName: fullName || 'Participant sans nom',
      church: church || 'Non spécifiée',
      contact: contact || 'Non renseigné',
      district: district || 'District du Phare',
      districtOther: normalizedData.districtOther || '',
      club,
      clubOther: normalizedData.clubOther || '',
      tshirtSize,
      tshirtSizeOther: normalizedData.tshirtSizeOther || '',
      hasIllness,
      illnessDetails,
      currentStep: 'confirmation',
      paymentClicked: true,
      paymentClickedAt: normalizedData.paymentClickedAt || new Date().toISOString(),
      proofFile: normalizedData.proofFile || null,
      status,
      adminNotes,
      transactionPhone,
      createdAt: normalizedData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    rows.push({
      rowNumber,
      originalData: raw,
      record,
      warnings,
      isValid,
      isDuplicateWithExisting,
    });
  });

  return {
    fileName,
    totalRows: rawRows.length,
    validCount,
    warningCount,
    rows,
    detectedColumns: Array.from(detectedHeaders),
    format,
  };
}

/**
 * Sample CSV Template content
 */
export function generateSampleCsv(): string {
  const headers = [
    'Nom et Prénoms',
    'Téléphone (WhatsApp)',
    'Église locale',
    'District',
    'Club',
    'Taille T-shirt',
    'Antécédents médicaux',
    'Détails maladie',
    'Statut',
  ];

  const sampleRows = [
    [
      'KOUAME Koffi Jonathan',
      '0701020304',
      'Temple du Jubilé (Cocody)',
      'District du Phare',
      'Chef Guide',
      'L',
      'Non',
      '',
      'Confirmé',
    ],
    [
      'AMANI Marie-Esther',
      '0504030201',
      'Béthel (Yopougon)',
      'District de Songon',
      'Leader de Jeunesse',
      'M',
      'Non',
      '',
      'Confirmé',
    ],
    [
      'YAO Franck Olivier',
      '0102030405',
      'Maranatha (Treichville)',
      'District de Pole Maritime',
      'Éclaireur',
      'S',
      'Oui',
      'Légère crise d’asthme à l’effort',
      'Confirmé',
    ],
  ];

  const csvLines = [
    headers.join(';'),
    ...sampleRows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(';')),
  ];

  return csvLines.join('\r\n');
}

/**
 * Sample JSON Template content
 */
export function generateSampleJson(): string {
  const sample = {
    eventName: 'Randonnée 2026 - Forêt du Banco',
    exportedAt: new Date().toISOString(),
    registrations: [
      {
        fullName: 'KOUAME Koffi Jonathan',
        contact: '0701020304',
        church: 'Temple du Jubilé (Cocody)',
        district: 'District du Phare',
        club: 'Chef Guide',
        tshirtSize: 'L',
        hasIllness: 'Non',
        illnessDetails: '',
        status: 'confirmed',
      },
      {
        fullName: 'AMANI Marie-Esther',
        contact: '0504030201',
        church: 'Béthel (Yopougon)',
        district: 'District de Songon',
        club: 'Leader de Jeunesse',
        tshirtSize: 'M',
        hasIllness: 'Non',
        illnessDetails: '',
        status: 'confirmed',
      },
      {
        fullName: 'YAO Franck Olivier',
        contact: '0102030405',
        church: 'Maranatha (Treichville)',
        district: 'District de Pole Maritime',
        club: 'Éclaireur',
        tshirtSize: 'S',
        hasIllness: 'Oui',
        illnessDetails: 'Légère crise d’asthme',
        status: 'confirmed',
      },
    ],
  };

  return JSON.stringify(sample, null, 2);
}

/**
 * Download sample CSV file
 */
export function downloadSampleCsvFile(): void {
  const content = generateSampleCsv();
  // Include UTF-8 BOM so Excel opens it with French accents perfectly
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele_import_inscriptions_banco_2026.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download sample JSON file
 */
export function downloadSampleJsonFile(): void {
  const content = generateSampleJson();
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele_import_inscriptions_banco_2026.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
