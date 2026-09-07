import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle,
  AlertCircle,
  Download,
  X,
  RefreshCw,
  Copy,
  Users,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { RegistrationRecord, RegistrationStatus } from '../types.js';
import {
  parseImportFile,
  parseImportText,
  ParsedImportResult,
  downloadSampleCsvFile,
  downloadSampleJsonFile,
} from '../utils/importParsers.js';
import { saveToClientVault } from '../utils/persistenceVault.js';

interface ImportRegistrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  existingRegistrations: RegistrationRecord[];
  onImportSuccess: (importedCount: number, updatedCount: number) => void;
}

export const ImportRegistrationsModal: React.FC<ImportRegistrationsModalProps> = ({
  isOpen,
  onClose,
  token,
  existingRegistrations,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedImportResult | null>(null);

  // Import options
  const [defaultStatus, setDefaultStatus] = useState<RegistrationStatus>('confirmed');
  const [updateDuplicates, setUpdateDuplicates] = useState(true);

  // Success summary
  const [successInfo, setSuccessInfo] = useState<{
    imported: number;
    updated: number;
    total: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setSuccessInfo(null);
    setParsing(true);
    try {
      const result = await parseImportFile(selectedFile, existingRegistrations, defaultStatus);
      if (result.rows.length === 0) {
        throw new Error('Le fichier sélectionné ne contient aucune ligne de données.');
      }
      setParsedResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Erreur lors de la lecture du fichier.');
      setParsedResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handlePasteAnalyze = () => {
    if (!pasteText.trim()) {
      setParseError('Veuillez coller du texte au format CSV ou JSON.');
      return;
    }
    setParseError(null);
    setSuccessInfo(null);
    setParsing(true);
    try {
      const result = parseImportText(pasteText, existingRegistrations, defaultStatus);
      if (result.rows.length === 0) {
        throw new Error('Le texte collé n’a pas permis de détecter d’inscriptions valides.');
      }
      setParsedResult(result);
    } catch (err: any) {
      setParseError(err.message || 'Erreur lors de l’analyse du texte.');
      setParsedResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPasteText('');
    setParsedResult(null);
    setParseError(null);
    setSuccessInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecuteImport = async () => {
    if (!parsedResult || parsedResult.rows.length === 0) return;
    setImporting(true);
    setParseError(null);

    try {
      // Build payload records applying the chosen defaultStatus if needed
      const recordsToImport = parsedResult.rows.map((r) => {
        const item = { ...r.record };
        if (defaultStatus && (!r.record.status || defaultStatus !== 'confirmed')) {
          item.status = defaultStatus;
        }
        return item;
      });

      const res = await fetch('/api/admin/registrations/batch-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrations: recordsToImport,
          options: {
            defaultStatus,
            updateDuplicates,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l’importation.');
      }

      const imported = data.result?.importedCount ?? 0;
      const updated = data.result?.updatedCount ?? 0;
      const total = imported + updated;

      // Also immediately update the persistent browser client vault so it is never lost!
      if (data.result?.records && Array.isArray(data.result.records)) {
        saveToClientVault(data.result.records);
      }

      setSuccessInfo({ imported, updated, total });
      onImportSuccess(imported, updated);
    } catch (err: any) {
      setParseError(err.message || 'Erreur lors de l’enregistrement des inscriptions.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 leading-snug">
                Importer des Inscriptions (CSV & JSON)
              </h2>
              <p className="text-xs text-stone-700">
                Ajoutez rapidement plusieurs participants dans le tableau à partir d'un fichier ou en collant du texte.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Success screen */}
          {successInfo ? (
            <div className="py-8 px-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                Importation Réussie !
              </h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                Les participants ont été intégrés dans la base de données et sauvegardés durablement dans le coffre-fort persistant.
              </p>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="block text-2xl font-black text-emerald-700">{successInfo.imported}</span>
                  <span className="text-xs text-stone-700 font-medium">Nouveaux ajoutés</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="block text-2xl font-black text-amber-700">{successInfo.updated}</span>
                  <span className="text-xs text-stone-700 font-medium">Mis à jour</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <span className="block text-2xl font-black text-stone-900">{successInfo.total}</span>
                  <span className="text-xs text-stone-700 font-medium">Total traités</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"
                >
                  Importer un autre fichier
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
                >
                  Voir les inscrits dans le tableau
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('file');
                      setParseError(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'file'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Fichier (CSV / JSON / Excel)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('paste');
                      setParseError(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'paste'
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    Copier / Coller du texte
                  </button>
                </div>

                {/* Templates download links */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadSampleCsvFile}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    title="Télécharger un modèle CSV avec les colonnes attendues pour Excel"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Modèle CSV
                  </button>
                  <button
                    type="button"
                    onClick={downloadSampleJsonFile}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                    title="Télécharger un modèle JSON structuré"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    Modèle JSON
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {parseError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{parseError}</div>
                  <button onClick={() => setParseError(null)} className="text-rose-500 hover:text-rose-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Section if not parsed yet */}
              {!parsedResult && (
                <>
                  {activeTab === 'file' ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        isDragging
                          ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                          : 'border-stone-300 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/20'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelected(e.target.files[0]);
                          }
                        }}
                        accept=".csv, .json, .xlsx, .xls, text/csv, application/json"
                        className="hidden"
                      />
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center mb-3 shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-stone-800 mb-1">
                        Glissez-déposez votre fichier ici, ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-stone-700 max-w-sm mx-auto">
                        Formats acceptés : <strong>CSV (.csv)</strong>, <strong>JSON (.json)</strong> ou classeur <strong>Excel (.xlsx)</strong>.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Détection automatique des séparateurs (; ou ,) et des noms de colonnes
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-700">
                          Collez les lignes CSV ou un tableau JSON :
                        </label>
                        <span className="text-[11px] text-stone-700">
                          Exemple : Nom et Prénoms;Téléphone;Église;District;Club;Taille
                        </span>
                      </div>
                      <textarea
                        rows={8}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        placeholder={`KOUAME Koffi;0701020304;Temple du Jubilé;District du Phare;Chef Guide;L\nAMANI Marie;0504030201;Béthel Yopougon;District de Songon;Aîné;M`}
                        className="w-full font-mono text-xs p-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-stone-50"
                      />
                      <button
                        type="button"
                        onClick={handlePasteAnalyze}
                        disabled={parsing || !pasteText.trim()}
                        className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                      >
                        {parsing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Analyser et Prévisualiser les Lignes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Preview & Confirmation Section */}
              {parsedResult && (
                <div className="space-y-4">
                  {/* Summary Bar */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                        <Users className="w-4 h-4 text-stone-500" />
                        <span>Source :</span>
                        <strong className="text-stone-900">{parsedResult.fileName}</strong>
                      </div>
                      <div className="h-3 w-px bg-stone-200" />
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {parsedResult.validCount} valide(s)
                      </span>
                      {parsedResult.warningCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          {parsedResult.warningCount} avec remarque(s)
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={resetAll}
                      className="text-xs text-stone-700 hover:text-stone-900 font-semibold underline"
                    >
                      Changer de fichier / réinitialiser
                    </button>
                  </div>

                  {/* Options Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Statut par défaut des inscrits importés :
                      </label>
                      <select
                        value={defaultStatus}
                        onChange={(e) => setDefaultStatus(e.target.value as RegistrationStatus)}
                        className="w-full p-2 rounded-lg border border-stone-300 bg-white text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="confirmed">✅ Confirmé (Paiement déjà vérifié / validé)</option>
                        <option value="pending_verification">⏳ En attente de vérification (Preuve à vérifier)</option>
                        <option value="draft">📝 Brouillon (Non encore finalisé)</option>
                      </select>
                      <p className="text-[11px] text-stone-600 mt-1">
                        Recommandé : « Confirmé » si vous importez une liste de membres ayant déjà réglé.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Gestion des doublons (téléphone ou nom identique) :
                      </label>
                      <div className="space-y-1.5 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="duplicateOption"
                            checked={updateDuplicates}
                            onChange={() => setUpdateDuplicates(true)}
                            className="text-emerald-700 focus:ring-emerald-500"
                          />
                          <span className="text-stone-800 font-medium">Mettre à jour les informations existantes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="duplicateOption"
                            checked={!updateDuplicates}
                            onChange={() => setUpdateDuplicates(false)}
                            className="text-emerald-700 focus:ring-emerald-500"
                          />
                          <span className="text-stone-800 font-medium">Ignorer et ne pas écraser les doublons</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Preview Table */}
                  <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="max-h-60 overflow-y-auto overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-stone-100 text-stone-700 uppercase tracking-wider sticky top-0 z-10 border-b border-stone-200 font-bold text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Nom & Prénoms</th>
                            <th className="py-2.5 px-3">Téléphone</th>
                            <th className="py-2.5 px-3">Église</th>
                            <th className="py-2.5 px-3">District</th>
                            <th className="py-2.5 px-3">Club</th>
                            <th className="py-2.5 px-3">Taille</th>
                            <th className="py-2.5 px-3">Médical</th>
                            <th className="py-2.5 px-3">État</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-stone-700 font-medium">
                          {parsedResult.rows.map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={
                                row.isDuplicateWithExisting
                                  ? 'bg-amber-50/40 hover:bg-amber-50/70'
                                  : 'hover:bg-stone-50'
                              }
                            >
                              <td className="py-2 px-3 text-stone-400 font-mono text-[11px]">
                                {row.rowNumber}
                              </td>
                              <td className="py-2 px-3 font-semibold text-stone-900">
                                {row.record.fullName}
                              </td>
                              <td className="py-2 px-3 text-stone-800 font-mono text-[11px]">
                                {row.record.contact}
                              </td>
                              <td className="py-2 px-3 text-stone-600 truncate max-w-[140px]">
                                {row.record.church}
                              </td>
                              <td className="py-2 px-3 text-stone-600 truncate max-w-[120px]">
                                {row.record.district}
                              </td>
                              <td className="py-2 px-3">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                                  {row.record.club}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-bold text-stone-800">
                                {row.record.tshirtSize}
                              </td>
                              <td className="py-2 px-3 text-[11px]">
                                {row.record.hasIllness === 'Oui' ? (
                                  <span className="text-amber-700 font-bold" title={row.record.illnessDetails}>
                                    Oui
                                  </span>
                                ) : (
                                  <span className="text-stone-400">Non</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {row.isDuplicateWithExisting ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                                    Doublon existant
                                  </span>
                                ) : row.isValid ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                                    Prêt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                    Incomplet
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Persistence guarantee note */}
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2.5 text-xs text-stone-700">
                    <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      <strong>Sauvegarde durable garantie :</strong> Les données importées sont automatiquement écrites dans les fichiers permanents du serveur et synchronisées dans votre coffre-fort local de navigateur pour éviter toute perte de données.
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={importing}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      disabled={importing || parsedResult.validCount === 0}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Importation en cours...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Confirmer et Importer ({parsedResult.rows.length} participant{parsedResult.rows.length > 1 ? 's' : ''})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
