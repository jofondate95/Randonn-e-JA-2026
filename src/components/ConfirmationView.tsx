import React from 'react';
import {
  CheckCircle2,
  Clock,
  Printer,
  Compass,
  Calendar,
  MapPin,
  FileText,
  User,
  Church,
  Phone,
  Shirt,
  HeartPulse,
  Trees,
  ShieldCheck,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { RegistrationRecord, PaymentSettings } from '../types.js';
import { exportSingleParticipantPDF } from '../utils/exportUtils.js';

interface ConfirmationViewProps {
  registration: RegistrationRecord;
  settings: PaymentSettings;
  onNewRegistration: () => void;
}

export const ConfirmationView: React.FC<ConfirmationViewProps> = ({
  registration,
  settings,
  onNewRegistration,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isConfirmed = registration.status === 'confirmed';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-6">
      {/* Top Banner Status */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-[#5A5A40]/20 shadow-sm p-6 sm:p-10 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#f5f2ed] text-[#5A5A40] border border-[#5A5A40]/20 flex items-center justify-center mx-auto shadow-xs">
          {isConfirmed ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-700" />
          ) : (
            <Clock className="w-8 h-8 text-[#D2691E]" />
          )}
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              isConfirmed
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/15'
            }`}
          >
            {isConfirmed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Inscription Validée & Confirmée</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-[#D2691E] animate-spin" />
                <span>En attente de vérification par l'organisation</span>
              </>
            )}
          </span>

          <h2 className="text-2xl sm:text-3xl font-serif italic text-[#5A5A40] mt-3">
            {isConfirmed ? 'Votre participation est confirmée !' : 'Merci, votre inscription a bien été enregistrée !'}
          </h2>

          <p className="text-xs sm:text-sm text-[#7a7a72] max-w-xl mx-auto mt-1">
            Votre preuve de paiement a été transmise à notre trésorerie. Dès validation du versement Wave, votre badge officiel sera prêt.
          </p>
        </div>

        {/* Reference Badge */}
        <div className="inline-block p-5 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/20 text-center shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7a7a72]">
            Numéro de référence officiel
          </div>
          <div className="text-2xl sm:text-3xl font-serif italic font-bold text-[#D2691E] tracking-wider mt-1">
            {registration.id}
          </div>
          <div className="text-[11px] text-[#7a7a72] mt-0.5">
            Conservez ce numéro pour tout échange ou réclamation
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => exportSingleParticipantPDF(registration, settings)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#5A5A40] hover:bg-[#484833] shadow-md shadow-[#5A5A40]/20 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#D2691E]" />
            <span>Télécharger l'attestation PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-[#5A5A40] bg-white hover:bg-[#5A5A40] hover:text-white border-2 border-[#5A5A40] transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer la page</span>
          </button>

          <button
            onClick={onNewRegistration}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-stone-700 bg-stone-100 hover:bg-stone-200 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
            <span>Inscrire une autre personne</span>
          </button>
        </div>
      </div>

      {/* Recap Sheet */}
      <div className="bg-white/95 backdrop-blur-xs rounded-3xl border border-[#5A5A40]/20 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#5A5A40]/15">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D2691E]" />
            <h3 className="text-lg font-serif italic font-bold text-[#5A5A40]">
              Fiche récapitulative du participant
            </h3>
          </div>
          <span className="text-xs text-[#7a7a72]">
            Enregistré le {new Date(registration.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Nom & Prénoms</span>
            </div>
            <div className="font-bold text-[#2d2d2a]">{registration.fullName}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <Church className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Église locale</span>
            </div>
            <div className="font-bold text-[#2d2d2a]">{registration.church}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <Phone className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Numéro de contact</span>
            </div>
            <div className="font-bold text-[#2d2d2a] font-mono">{registration.contact}</div>
          </div>

          {registration.transactionPhone && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                <span>Numéro émetteur Wave (Transaction)</span>
              </div>
              <div className="font-bold text-emerald-950 font-mono">{registration.transactionPhone}</div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>District</span>
            </div>
            <div className="font-bold text-[#2d2d2a]">
              {registration.district === 'Autre' ? registration.districtOther : registration.district}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <Trees className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Club d'appartenance</span>
            </div>
            <div className="font-bold text-[#2d2d2a]">
              {registration.club === 'Autre' ? registration.clubOther : registration.club}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <Shirt className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Taille Tee-Shirt</span>
            </div>
            <div className="font-bold text-[#2d2d2a]">
              {registration.tshirtSize
                ? registration.tshirtSize === 'Autre'
                  ? registration.tshirtSizeOther
                  : registration.tshirtSize
                : 'Non demandée'}
            </div>
          </div>

          <div className="sm:col-span-2 p-4 rounded-xl bg-[#f5f2ed]/60 border border-[#5A5A40]/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a7a72] flex items-center gap-1.5 mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>Santé & Affections particulières</span>
            </div>
            <div className="font-semibold text-[#2d2d2a]">
              {registration.hasIllness === 'Oui' ? (
                <span className="text-[#D2691E]">
                  Oui — {registration.illnessDetails || 'Détails non renseignés'}
                </span>
              ) : (
                <span className="text-emerald-800">Aucune maladie signalée (Aptitude normale)</span>
              )}
            </div>
          </div>
        </div>

        {/* Payment proof metadata */}
        {registration.proofFile && (
          <div className="p-4 rounded-2xl bg-[#f5f2ed] border border-[#5A5A40]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center font-bold text-xs">
                OK
              </div>
              <div>
                <div className="text-xs font-bold text-[#2d2d2a]">Preuve de paiement reçue</div>
                <div className="text-[11px] text-[#7a7a72]">
                  {registration.proofFile.originalName} ({Math.round(registration.proofFile.size / 1024)} Ko)
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A5A40] bg-white border border-[#5A5A40]/20 px-3 py-1 rounded-full">
              Reçu archivé
            </span>
          </div>
        )}
      </div>

      {/* Practical Guide for the Hike */}
      <div className="bg-[#383827] text-white rounded-3xl p-6 sm:p-8 space-y-4 border border-[#5A5A40]/30 shadow-sm">
        <div className="flex items-center gap-2 text-[#D2691E]">
          <Trees className="w-5 h-5" />
          <h3 className="text-base font-serif italic font-bold tracking-wide text-amber-100">
            Recommandations pour la Randonnée du 15 Novembre 2026
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-stone-300">
          Pour profiter pleinement de cette traversée de la magnifique Forêt du Banco, munissez-vous des éléments indispensables :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="font-bold text-[#D2691E] mb-1 uppercase tracking-wider text-[10px]">1. Hydratation</div>
            <p className="text-stone-300">Bouteille d'eau ou gourde d'au moins 1,5 L par personne.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="font-bold text-[#D2691E] mb-1 uppercase tracking-wider text-[10px]">2. Chaussures</div>
            <p className="text-stone-300">Baskets ou chaussures de marche adaptées aux sentiers forestiers.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="font-bold text-[#D2691E] mb-1 uppercase tracking-wider text-[10px]">3. Protection</div>
            <p className="text-stone-300">Casquette ou chapeau, lotion anti-moustiques et protection solaire.</p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <div className="font-bold text-[#D2691E] mb-1 uppercase tracking-wider text-[10px]">4. Heure d'arrivée</div>
            <p className="text-stone-300">Rassemblement dès 06h30 à l'entrée principale du Banco.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
