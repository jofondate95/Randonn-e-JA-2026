import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RegistrationRecord, PaymentSettings } from '../types';

export interface ExportFilterInfo {
  statusFilter?: string;
  clubFilter?: string;
  districtFilter?: string;
  searchQuery?: string;
  totalCount?: number;
  filteredCount?: number;
}

/**
 * Format status for human-readable presentation in documents
 */
export function formatStatusLabel(status: string, paymentClicked?: boolean): string {
  switch (status) {
    case 'confirmed':
      return 'Confirmé (Paiement validé)';
    case 'pending_verification':
      return 'En attente de vérification';
    case 'rejected':
      return 'Rejeté';
    case 'payment_clicked':
      return 'Lien cliqué (Preuve non reçue)';
    default:
      if (paymentClicked) return 'Lien cliqué (Preuve non reçue)';
      return 'Brouillon';
  }
}

/**
 * EXCEL EXPORT (.xlsx)
 * Generates a clean, well-formatted spreadsheet with multiple sheets and auto-sized columns.
 */
export function exportRegistrationsToExcel(
  records: RegistrationRecord[],
  filterInfo?: ExportFilterInfo,
  fileName?: string
): void {
  const finalFileName =
    fileName ||
    `registre-inscriptions-randonnee-2026-${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Sheet 1: Detailed Registrations Table
  const tableData = records.map((r, index) => ({
    'N°': index + 1,
    'Référence': r.id,
    "Date d'inscription": r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '',
    'Nom & Prénoms': r.fullName || '',
    'Église locale': r.church || '',
    'Numéro de Contact': r.contact || '',
    'N° Transaction Wave': r.transactionPhone || r.contact || '',
    'District': r.district === 'Autre' ? r.districtOther || 'Autre' : r.district || '',
    'Club': r.club === 'Autre' ? r.clubOther || 'Autre' : r.club || '',
    'Taille T-Shirt':
      r.tshirtSize === 'Autre'
        ? r.tshirtSizeOther || 'Autre'
        : r.tshirtSize || 'Non spécifié',
    'Affection / Allergie': r.hasIllness === 'Oui' ? 'OUI' : 'NON',
    'Détails Médicaux': r.illnessDetails || 'Aucun',
    "Statut de l'inscription": formatStatusLabel(r.status, r.paymentClicked),
    'Preuve transmise': r.proofFile ? 'OUI' : 'NON',
    'Fichier de preuve': r.proofFile ? r.proofFile.originalName : 'Aucun',
    'Taille fichier preuve': r.proofFile
      ? `${(r.proofFile.size / 1024).toFixed(1)} Ko`
      : '-',
    'Clic Lien Paiement': r.paymentClicked ? 'OUI' : 'NON',
    'Date clic paiement': r.paymentClickedAt
      ? new Date(r.paymentClickedAt).toLocaleString('fr-FR')
      : '-',
    'Notes Administrateur': r.adminNotes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(tableData);

  // Calculate auto column widths
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

  // Sheet 2: Summary / Statistics & Metadata
  const total = records.length;
  const confirmed = records.filter((r) => r.status === 'confirmed').length;
  const pending = records.filter((r) => r.status === 'pending_verification').length;
  const rejected = records.filter((r) => r.status === 'rejected').length;
  const paymentOnly = records.filter(
    (r) => r.paymentClicked && r.status !== 'confirmed' && r.status !== 'pending_verification'
  ).length;
  const withIllness = records.filter((r) => r.hasIllness === 'Oui').length;

  const summaryData = [
    { 'Propriété / Indicateur': 'Événement', 'Valeur': 'Randonnée Forêt du Banco 2026' },
    { 'Propriété / Indicateur': 'Date de la Randonnée', 'Valeur': 'Dimanche 15 Novembre 2026' },
    { 'Propriété / Indicateur': 'Lieu', 'Valeur': 'Parc National du Banco, Abidjan' },
    { 'Propriété / Indicateur': "Date d'exportation", 'Valeur': new Date().toLocaleString('fr-FR') },
    {
      'Propriété / Indicateur': 'Filtre appliqué',
      'Valeur': filterInfo?.statusFilter
        ? `Statut: ${filterInfo.statusFilter}, Club: ${filterInfo.clubFilter || 'Tous'}, District: ${filterInfo.districtFilter || 'Tous'}`
        : 'Tous les enregistrements sans filtre',
    },
    { 'Propriété / Indicateur': 'Nombre de participants dans cet export', 'Valeur': total },
    { 'Propriété / Indicateur': 'Inscriptions Confirmées (Validées)', 'Valeur': confirmed },
    { 'Propriété / Indicateur': 'Inscriptions En Attente de Vérification', 'Valeur': pending },
    { 'Propriété / Indicateur': 'Clics Paiement sans Preuve Soumise', 'Valeur': paymentOnly },
    { 'Propriété / Indicateur': 'Inscriptions Rejetées', 'Valeur': rejected },
    { 'Propriété / Indicateur': 'Participants avec Affection Médicale', 'Valeur': withIllness },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 45 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Synthèse & Contrôle');

  // Trigger download
  XLSX.writeFile(wb, finalFileName);
}

/**
 * OFFICIAL PDF EXPORT
 * Generates an official administrative registry document in landscape A4.
 */
export function exportRegistrationsToPDF(
  records: RegistrationRecord[],
  filterInfo?: ExportFilterInfo,
  adminEmail?: string,
  fileName?: string
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary palette: Olive #5A5A40 [90, 90, 64], Terracotta #D2691E [210, 105, 30]
  const primaryColor: [number, number, number] = [90, 90, 64];
  const accentColor: [number, number, number] = [210, 105, 30];

  // Header band
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Top accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 22, pageWidth, 2, 'F');

  // Header text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(
    'COMITÉ D’ORGANISATION • RANDONNÉE FORÊT DU BANCO 2026',
    14,
    10
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'REGISTRE OFFICIEL DES PARTICIPANTS ET PREUVES DE PAIEMENT (DOC. OFFICIEL VALANT PREUVE)',
    14,
    16
  );

  // Right date in header
  const exportDateStr = new Date().toLocaleString('fr-FR');
  doc.setFontSize(8);
  doc.text(`Édité le : ${exportDateStr}`, pageWidth - 14, 10, { align: 'right' });
  if (adminEmail) {
    doc.text(`Par : ${adminEmail}`, pageWidth - 14, 15, { align: 'right' });
  }

  // Summary statistics badges
  const total = records.length;
  const confirmed = records.filter((r) => r.status === 'confirmed').length;
  const pending = records.filter((r) => r.status === 'pending_verification').length;
  const withIllness = records.filter((r) => r.hasIllness === 'Oui').length;

  doc.setTextColor(45, 45, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);

  const statsY = 30;
  // Box 1: Total
  doc.setFillColor(245, 242, 237);
  doc.roundedRect(14, statsY, 60, 12, 2, 2, 'F');
  doc.setTextColor(90, 90, 64);
  doc.text(`TOTAL INSCRITS : ${total}`, 18, statsY + 7);

  // Box 2: Confirmés
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(78, statsY, 60, 12, 2, 2, 'F');
  doc.setTextColor(22, 101, 52);
  doc.text(`VALIDÉS / CONFIRMÉS : ${confirmed}`, 82, statsY + 7);

  // Box 3: En attente
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(142, statsY, 62, 12, 2, 2, 'F');
  doc.setTextColor(180, 83, 9);
  doc.text(`EN ATTENTE DE VÉRIF. : ${pending}`, 146, statsY + 7);

  // Box 4: Cas Médicaux
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(208, statsY, 75, 12, 2, 2, 'F');
  doc.setTextColor(185, 28, 28);
  doc.text(`CAS MÉDICAUX SIGNALÉS : ${withIllness}`, 212, statsY + 7);

  // Build Table Body
  const tableRows = records.map((r, idx) => {
    const clubDisplay = r.club === 'Autre' ? r.clubOther || 'Autre' : r.club || '-';
    const districtDisplay = r.district === 'Autre' ? r.districtOther || 'Autre' : r.district || '-';
    const tshirtDisplay = r.tshirtSize === 'Autre' ? r.tshirtSizeOther || 'Autre' : r.tshirtSize || '-';
    const healthDisplay = r.hasIllness === 'Oui' ? `OUI: ${r.illnessDetails || 'Signalé'}` : 'RAS';
    
    let statusText = 'En attente';
    if (r.status === 'confirmed') statusText = 'CONFIRMÉ';
    else if (r.status === 'rejected') statusText = 'REJETÉ';
    else if (r.paymentClicked && !r.proofFile) statusText = 'Clic sans preuve';

    const proofText = r.proofFile ? 'Preuve reçue' : 'Sans preuve';

    return [
      idx + 1,
      r.id,
      r.fullName || '-',
      r.church || '-',
      r.contact || '-',
      districtDisplay,
      clubDisplay,
      tshirtDisplay,
      healthDisplay,
      statusText,
      proofText,
    ];
  });

  autoTable(doc, {
    startY: 46,
    head: [[
      'N°',
      'Référence',
      'Nom & Prénoms',
      'Église Locale',
      'Contact',
      'District',
      'Club',
      'Taille',
      'Santé / Suivi',
      'Statut',
      'Preuve',
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [90, 90, 64],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [45, 45, 42],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 245],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold' },
      2: { cellWidth: 38, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 28 },
      6: { cellWidth: 26 },
      7: { cellWidth: 15, halign: 'center' },
      8: { cellWidth: 34 },
      9: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      10: { cellWidth: 20, halign: 'center' },
    },
    didParseCell: (data) => {
      // Colorize Status column
      if (data.section === 'body' && data.column.index === 9) {
        const val = String(data.cell.raw);
        if (val === 'CONFIRMÉ') {
          data.cell.styles.textColor = [22, 101, 52];
        } else if (val === 'REJETÉ') {
          data.cell.styles.textColor = [185, 28, 28];
        } else {
          data.cell.styles.textColor = [194, 65, 12];
        }
      }
      // Highlight Health alert
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw);
        if (val.startsWith('OUI')) {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, top: 46, bottom: 25 },
  });

  // Footer & Signatures on pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Decorative line above footer
    doc.setDrawColor(210, 205, 195);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    // Legal notice & page numbering
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 115);
    doc.text(
      'Document officiel d’émargement et de contrôle — Randonnée Forêt du Banco 2026 • Fait foi pour l’accès au site et l’attribution des kits.',
      14,
      pageHeight - 9
    );
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 14, pageHeight - 9, { align: 'right' });

    // On last page, add signature boxes
    if (i === pageCount) {
      const sigY = pageHeight - 32;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 64);

      // Signature 1
      doc.text('Pour le Secrétariat & Logistique :', 20, sigY);
      doc.setFont('helvetica', 'normal');
      doc.text('(Nom, Date et Signature)', 20, sigY + 4);
      doc.setDrawColor(180, 180, 175);
      doc.line(20, sigY + 11, 75, sigY + 11);

      // Signature 2
      doc.setFont('helvetica', 'bold');
      doc.text('Pour la Trésorerie (Paiements Validés) :', 115, sigY);
      doc.setFont('helvetica', 'normal');
      doc.text('(Vérification Mobile Money)', 115, sigY + 4);
      doc.line(115, sigY + 11, 185, sigY + 11);

      // Signature 3
      doc.setFont('helvetica', 'bold');
      doc.text('Pour la Coordination Générale :', 215, sigY);
      doc.setFont('helvetica', 'normal');
      doc.text('(Visa & Cachet Officiel)', 215, sigY + 4);
      doc.line(215, sigY + 11, 280, sigY + 11);
    }
  }

  const finalPdfName =
    fileName ||
    `registre-officiel-randonnee-2026-${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(finalPdfName);
}

/**
 * INDIVIDUAL PARTICIPANT PDF
 * Official registration certificate & payment proof receipt for a single participant.
 */
export function exportSingleParticipantPDF(
  r: RegistrationRecord,
  settings?: PaymentSettings | null
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(90, 90, 64);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setFillColor(210, 105, 30);
  doc.rect(0, 32, pageWidth, 2.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('RANDONNÉE FORÊT DU BANCO 2026', pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('COMITÉ D’ORGANISATION • REÇU OFFICIEL DE PARTICIPATION & PREUVE DE PAIEMENT', pageWidth / 2, 21, {
    align: 'center',
  });
  doc.setFontSize(8);
  doc.text('Dimanche 15 Novembre 2026 — Parc National du Banco, Abidjan', pageWidth / 2, 27, {
    align: 'center',
  });

  // Official Reference Block
  doc.setFillColor(245, 242, 237);
  doc.roundedRect(18, 42, pageWidth - 36, 26, 3, 3, 'F');
  doc.setDrawColor(90, 90, 64);
  doc.setLineWidth(0.4);
  doc.roundedRect(18, 42, pageWidth - 36, 26, 3, 3, 'D');

  doc.setTextColor(120, 120, 115);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('NUMÉRO DE RÉFÉRENCE OFFICIEL :', 24, 50);

  doc.setTextColor(210, 105, 30);
  doc.setFontSize(16);
  doc.text(r.id, 24, 60);

  // Status badge on right
  const isConfirmed = r.status === 'confirmed';
  if (isConfirmed) {
    doc.setFillColor(22, 101, 52);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(pageWidth - 75, 48, 50, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.text('INSCRIPTION VALIDÉE', pageWidth - 50, 56.5, { align: 'center' });
  } else {
    doc.setFillColor(217, 119, 6);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(pageWidth - 85, 48, 60, 14, 2, 2, 'F');
    doc.setFontSize(8.5);
    doc.text('EN ATTENTE DE VALIDATION', pageWidth - 55, 56.5, { align: 'center' });
  }

  // Participant details table
  const details = [
    ['Nom & Prénoms :', r.fullName || '-'],
    ['Église Locale :', r.church || '-'],
    ['Numéro de Téléphone :', r.contact || '-'],
    ['Numéro Émetteur Wave :', r.transactionPhone || r.contact || '-'],
    ['District :', r.district === 'Autre' ? r.districtOther || 'Autre' : r.district || '-'],
    ['Club d’Appartenance :', r.club === 'Autre' ? r.clubOther || 'Autre' : r.club || '-'],
    [
      'Taille du T-Shirt :',
      r.tshirtSize === 'Autre' ? r.tshirtSizeOther || 'Autre' : r.tshirtSize || 'Non spécifié',
    ],
    [
      'Affections / Santé :',
      r.hasIllness === 'Oui'
        ? `ATTENTION: ${r.illnessDetails || 'Affection signalée'}`
        : 'Aucune affection signalée (RAS)',
    ],
    ['Montant de la participation :', settings?.paymentAmount || '5 000 FCFA'],
    ['Date d’enregistrement :', r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '-'],
    [
      'Fichier de preuve joint :',
      r.proofFile ? `${r.proofFile.originalName} (${Math.round(r.proofFile.size / 1024)} Ko)` : 'Non fourni',
    ],
    ['Notes Administratives :', r.adminNotes || 'Dossier complet conforme'],
  ];

  autoTable(doc, {
    startY: 74,
    body: details,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, textColor: [90, 90, 64], fontSize: 9 },
      1: { cellWidth: pageWidth - 36 - 55, textColor: [45, 45, 42], fontSize: 9 },
    },
    bodyStyles: {
      cellPadding: 2.8,
    },
    margin: { left: 18, right: 18 },
  });

  // Verification & security notice
  const endY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFillColor(248, 246, 241);
  doc.roundedRect(18, endY, pageWidth - 36, 40, 2, 2, 'F');
  doc.setDrawColor(210, 205, 195);
  doc.roundedRect(18, endY, pageWidth - 36, 40, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 64);
  doc.text('CONSIGNES IMPORTANTES POUR LE PARTICIPANT :', 24, endY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 75);
  doc.text(
    '• Présentez ce reçu imprimé ou sur votre smartphone au point de rassemblement pour retirer votre kit et badge.',
    24,
    endY + 15
  );
  doc.text(
    '• Prévoyez une gourde d’eau d’au moins 1,5 L, des chaussures de marche fermées et une protection solaire/casquette.',
    24,
    endY + 21
  );
  doc.text(
    '• Rendez-vous dès 06h30 précises à l’entrée principale du Parc National du Banco (Côté autoroute du Nord).',
    24,
    endY + 27
  );
  doc.text(
    '• En cas de question ou réclamation, communiquez votre référence officielle auprès de la commission d’organisation.',
    24,
    endY + 33
  );

  // Signatures at bottom
  const sigY = endY + 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 64);
  doc.text('Le Participant :', 24, sigY);
  doc.line(24, sigY + 14, 75, sigY + 14);

  doc.text('Visa & Cachet Trésorerie :', pageWidth - 80, sigY);
  doc.line(pageWidth - 80, sigY + 14, pageWidth - 24, sigY + 14);

  // Footer note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 145);
  doc.text(
    'Document certifié généré par la plateforme officielle Randonnée 2026 • Tous droits réservés Comité d’Organisation.',
    pageWidth / 2,
    285,
    { align: 'center' }
  );

  doc.save(`recu-inscription-${r.id}.pdf`);
}
