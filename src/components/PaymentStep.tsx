import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  Upload,
  FileCheck,
  ArrowLeft,
  ShieldCheck,
  Info,
  AlertCircle,
  X,
  FileText,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { PaymentSettings, RegistrationRecord } from '../types.js';

export const PERMANENT_OFFICIAL_WAVE_LINK = 'https://pay.wave.com/m/M_ci_ZfLyfzYgXEbI/c/ci/?amount=5050';

interface PaymentStepProps {
  settings: PaymentSettings;
  registration: RegistrationRecord;
  onTrackPaymentClick: () => Promise<void>;
  onUploadProofAndSubmit: (file: File) => Promise<boolean>;
  onBackToForm: () => void;
  isSubmitting: boolean;
}

export const PaymentStep: React.FC<PaymentStepProps> = ({
  settings,
  registration,
  onTrackPaymentClick,
  onUploadProofAndSubmit,
  onBackToForm,
  isSubmitting,
}) => {
  const [hasClickedPayment, setHasClickedPayment] = useState(registration.paymentClicked || false);
  const [isReadyToUpload, setIsReadyToUpload] = useState(registration.paymentClicked || false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permanently wired to the official Wave payment link
  const wavePaymentUrl = (settings.waveLink && settings.waveLink.trim() && settings.waveLink !== 'https://wave.com')
    ? settings.waveLink.trim()
    : PERMANENT_OFFICIAL_WAVE_LINK;

  const waveRecipient = settings.waveRecipientName || settings.momoRecipientName || 'Comité Randonnée Banco 2026';

  const handlePaymentLinkClick = () => {
    setHasClickedPayment(true);
    setIsReadyToUpload(true);
    // Track click asynchronously in background
    onTrackPaymentClick().catch((e) => {
      console.error('Error tracking payment click', e);
    });
  };

  const handleManualPaymentClick = async () => {
    setHasClickedPayment(true);
    setIsReadyToUpload(true);
    try {
      await onTrackPaymentClick();
    } catch (e) {
      console.error('Error tracking payment click', e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Le fichier dépasse la taille maximale autorisée (10 Mo).');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Format non pris en charge. Veuillez fournir un fichier JPG, PNG ou PDF.');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedFile) {
      setUploadError('Veuillez joindre la capture ou photo de votre preuve de paiement avant de valider.');
      return;
    }
    setUploadError(null);
    await onUploadProofAndSubmit(selectedFile);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
      {/* Header bar with Serif Title, Step Badge and Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-0.5 w-6 bg-[#D2691E]" />
            <span className="uppercase tracking-[0.25em] text-[10px] font-bold text-[#7a7a72]">
              Étape Deuxième
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-[#5A5A40]">
            Règlement & Preuve de Paiement
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7a72] mt-0.5">
            Effectuez votre transfert puis joignez votre capture d'écran pour valider votre place.
          </p>
        </div>

        <div className="bg-white px-4 py-2 rounded-full shadow-xs border border-[#5A5A40]/20 flex items-center gap-2.5 self-start sm:self-auto">
          <span className="text-[10px] font-bold text-[#7a7a72] uppercase tracking-widest">
            Étape
          </span>
          <span className="text-sm font-bold text-[#D2691E]">02 / 03</span>
        </div>
      </div>

      {/* Participant summary banner */}
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-[#5A5A40]/15 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToForm}
            className="p-2 rounded-full text-[#5A5A40] hover:bg-[#5A5A40]/10 transition-colors"
            title="Revenir au formulaire"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72]">Participant en cours</div>
            <div className="text-sm sm:text-base font-bold text-[#2d2d2a]">{registration.fullName}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72]">Frais d'inscription</div>
            <div className="text-lg font-serif italic font-bold text-[#D2691E]">{settings.paymentAmount || '5 050 FCFA'}</div>
          </div>
          <button
            onClick={onBackToForm}
            className="text-xs font-bold uppercase tracking-wider text-[#5A5A40] hover:text-[#D2691E] px-3.5 py-1.5 rounded-full border border-[#5A5A40]/20 hover:border-[#D2691E] transition-all"
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Main Payment Instructions Card */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-[#5A5A40]/20 shadow-sm p-6 sm:p-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-sky-100 text-sky-900 border border-sky-200 mb-3">
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            <span>1. Paiement exclusif via Wave</span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif italic font-bold text-[#5A5A40]">
            Régler votre inscription par Wave
          </h3>
          <p className="text-xs sm:text-sm text-[#7a7a72] mt-1">
            {settings.generalInstructions ||
              'Cliquez sur le lien direct Wave ci-dessous pour payer vos frais d’inscription en toute sécurité.'}
          </p>
        </div>

        {/* Dedicated Wave Payment Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-sky-50/40 border-2 border-sky-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sky-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1DC2EC] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#1DC2EC]/30 shrink-0">
                W
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 mb-0.5">
                  <span>Wave Côte d'Ivoire</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-xs text-stone-600">
                  Bénéficiaire officiel : <strong className="text-stone-900">{waveRecipient}</strong>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                Montant à régler
              </span>
              <div className="text-2xl sm:text-3xl font-serif italic font-bold text-sky-950">
                {settings.paymentAmount || '5 000 FCFA'}
              </div>
            </div>
          </div>

          {/* Primary Action: Direct Wave link click */}
          <div className="space-y-4">
            <a
              href={wavePaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handlePaymentLinkClick}
              className="w-full py-4.5 px-6 rounded-2xl bg-[#1DC2EC] hover:bg-[#18add4] text-white font-bold text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#1DC2EC]/35 transition-all transform active:scale-[0.99] cursor-pointer text-center no-underline"
            >
              <Smartphone className="w-6 h-6 shrink-0" />
              <span>Payer avec Wave ({settings.paymentAmount || '5 050 FCFA'})</span>
              <ExternalLink className="w-5 h-5 shrink-0" />
            </a>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={handleManualPaymentClick}
                className="text-xs sm:text-sm font-medium text-stone-500 hover:text-stone-800 underline decoration-stone-300 hover:decoration-stone-600 transition-colors cursor-pointer"
              >
                J'ai déjà effectué mon transfert sur Wave → Passer à la preuve
              </button>
            </div>
          </div>
        </div>

        {/* Step 2: Upload Proof */}
        <div className="pt-6 border-t border-[#5A5A40]/15 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/15">
              <FileCheck className="w-3.5 h-3.5 text-[#D2691E]" />
              <span>2. Joindre la capture de confirmation Wave</span>
            </div>
            {hasClickedPayment && (
              <span className="text-[11px] font-medium text-sky-700 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" /> Wave ouvert / Paiement initié
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-serif italic font-bold text-[#5A5A40]">
              Preuve de paiement Wave (capture d'écran ou reçu)
            </h3>
            <p className="text-xs text-[#7a7a72] mt-0.5">
              Joignez la capture d'écran du reçu de transaction Wave (reçu vert ou SMS de confirmation Wave, format JPG, PNG ou PDF, max 10 Mo).
            </p>
          </div>

          {/* Upload Drop Zone / Picker */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-[#D2691E] hover:bg-[#f5f2ed]/60 ${
                uploadError ? 'border-red-400 bg-red-50/20' : 'border-[#5A5A40]/30 bg-[#f5f2ed]/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-white text-[#5A5A40] border border-[#5A5A40]/20 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Upload className="w-5 h-5 text-[#D2691E]" />
              </div>
              <div className="text-sm font-bold text-[#2d2d2a]">
                Cliquez pour importer votre capture ou déposez-la ici
              </div>
              <div className="text-xs text-[#7a7a72] mt-1">Formats acceptés : JPG, PNG, WEBP ou PDF (max 10 Mo)</div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-[#5A5A40]/30 bg-[#f5f2ed]/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2d2d2a] max-w-xs truncate">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-[#7a7a72]">
                      {(selectedFile.size / 1024).toFixed(1)} Ko • Prêt pour la transmission
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-lg text-[#7a7a72] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Supprimer ce fichier"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image preview */}
              {filePreview && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#5A5A40]/20 max-h-56 bg-white flex items-center justify-center">
                  <img
                    src={filePreview}
                    alt="Aperçu preuve de paiement"
                    className="max-h-56 w-auto object-contain"
                  />
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Final Submission Button */}
        <div className="pt-6 border-t border-[#5A5A40]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBackToForm}
            className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider text-[#7a7a72] hover:text-[#2d2d2a] px-4 py-3"
          >
            ← Retour au formulaire
          </button>

          <button
            type="button"
            disabled={isSubmitting || !selectedFile}
            onClick={handleFinalSubmit}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
              !selectedFile || isSubmitting
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-[#5A5A40] hover:bg-[#484833] text-white shadow-lg shadow-[#5A5A40]/25 active:scale-[0.99]'
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Envoi de la preuve...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#D2691E]" />
                <span>Confirmer et terminer mon inscription</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
