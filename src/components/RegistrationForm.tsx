import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Church,
  Phone,
  Compass,
  Shirt,
  HeartPulse,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  Share2,
} from 'lucide-react';
import { RegistrationFormData, ClubType, TshirtSize } from '../types.js';

interface RegistrationFormProps {
  initialData: RegistrationFormData;
  onSubmit: (data: RegistrationFormData) => void;
  onAutoSave: (data: RegistrationFormData) => void;
  lastSavedText: string;
  isSaving: boolean;
  onShareClick?: () => void;
}

const DISTRICT_OPTIONS = [
  'District Abidjan Nord',
  'District Abidjan Sud',
  'District Abidjan Est',
  'District Abidjan Ouest',
  'District Yopougon',
  'District Cocody',
  'District Port-Bouët / Koumassi',
  'District Grand-Bassam',
  'District Anyama / Bingerville',
  'District Dabou / Tiassalé',
  'District Bouaké',
  'Autre',
];

const CLUB_OPTIONS: { id: ClubType; label: string; desc: string }[] = [
  { id: 'Aventurier', label: 'Aventurier', desc: '6 à 9 ans' },
  { id: 'Éclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
  { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
  { id: 'Aîné', label: 'Aîné', desc: 'Jeunes Adultes' },
  { id: 'Chef Guide', label: 'Chef Guide', desc: 'Cadres & Formateurs' },
  { id: 'Leader de Jeunesse', label: 'Leader de Jeunesse', desc: 'Responsables' },
  { id: 'Autre', label: 'Autre', desc: 'Sympathisant / Invité' },
];

const TSHIRT_OPTIONS: TshirtSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Autre'];

const CHURCH_SUGGESTIONS = [
  'Temple du Jubilé (Cocody)',
  'Béthel (Yopougon)',
  'Maranatha (Treichville)',
  'Philadelphie (Abobo)',
  'Salem (Port-Bouët)',
  'Sinaï (Koumassi)',
  'Riviera Palmeraie',
  'Angré Djibi',
  'Grand-Bassam Centre',
  'Bingerville Espérance',
  'Yopougon Attié',
  'Marcory Résidentiel',
  'Adjamé 220 Logements',
];

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  initialData,
  onSubmit,
  onAutoSave,
  lastSavedText,
  isSaving,
  onShareClick,
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [churchQuery, setChurchQuery] = useState(initialData.church || '');
  const [showChurchSuggestions, setShowChurchSuggestions] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sync state if initialData changes externally
  useEffect(() => {
    setFormData(initialData);
    setChurchQuery(initialData.church || '');
  }, [initialData]);

  // Debounced Auto-Save trigger
  useEffect(() => {
    if (!hasInteracted) return;
    const handler = setTimeout(() => {
      onAutoSave(formData);
    }, 1200);

    return () => clearTimeout(handler);
  }, [formData, hasInteracted, onAutoSave]);

  const updateField = (field: keyof RegistrationFormData, value: any) => {
    setHasInteracted(true);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nom & Prénoms: lettres, espaces, tirets, apostrophes
    if (!formData.fullName || formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Le nom et les prénoms sont obligatoires (au moins 3 caractères).';
    } else if (!/^[\p{L}\s'’-]+$/u.test(formData.fullName.trim())) {
      newErrors.fullName = 'Veuillez saisir un nom valide (uniquement lettres et espaces).';
    }

    // Église
    if (!formData.church || formData.church.trim().length < 2) {
      newErrors.church = "L'église est obligatoire.";
    }

    // Contact (+225 ou 10 chiffres CI)
    const rawContact = formData.contact.replace(/\s+/g, '');
    if (!rawContact) {
      newErrors.contact = 'Le numéro de contact est obligatoire.';
    } else if (
      // CI numbers: 10 digits e.g. 0708091011 or with +225 e.g. +2250708091011
      !/^(\+225)?[0-9]{10}$/.test(rawContact) &&
      !/^0[157][0-9]{8}$/.test(rawContact) &&
      rawContact.length < 8
    ) {
      newErrors.contact = 'Veuillez entrer un numéro valide de Côte d’Ivoire (+225 XX XX XX XX XX).';
    }

    // District
    if (!formData.district) {
      newErrors.district = 'Veuillez sélectionner votre district.';
    } else if (formData.district === 'Autre' && !formData.districtOther?.trim()) {
      newErrors.districtOther = 'Veuillez préciser le nom de votre district.';
    }

    // Club
    if (!formData.club) {
      newErrors.club = 'Veuillez choisir votre club.';
    } else if (formData.club === 'Autre' && !formData.clubOther?.trim()) {
      newErrors.clubOther = 'Veuillez préciser votre club.';
    }

    // Taille T-shirt
    if (formData.tshirtSize === 'Autre' && !formData.tshirtSizeOther?.trim()) {
      newErrors.tshirtSizeOther = 'Veuillez préciser votre taille de tee-shirt.';
    }

    // Maladie
    if (!formData.hasIllness) {
      newErrors.hasIllness = 'Ce champ est obligatoire.';
    } else if (formData.hasIllness === 'Oui' && !formData.illnessDetails?.trim()) {
      newErrors.illnessDetails = 'Veuillez préciser votre affection ou allergie médicale pour votre sécurité.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.form-error-field');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const filteredChurches = CHURCH_SUGGESTIONS.filter((ch) =>
    ch.toLowerCase().includes(churchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
      {/* Header bar with Serif Title, Step Badge and Auto-Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-0.5 w-6 bg-[#D2691E]" />
            <span className="uppercase tracking-[0.25em] text-[10px] font-bold text-[#7a7a72]">
              Étape Première
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-[#5A5A40]">
            Formulaire d'inscription
          </h2>
          <p className="text-xs sm:text-sm text-[#7a7a72] mt-0.5">
            Veuillez renseigner vos informations personnelles pour réserver votre place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onShareClick && (
            <button
              type="button"
              onClick={onShareClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[#5A5A40] hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#5A5A40]/25 transition-all shadow-2xs cursor-pointer"
              title="Obtenir le lien simplifié et QR Code du formulaire"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D2691E]" />
              <span className="hidden sm:inline">Lien simplifié</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-[#5A5A40] bg-white/80 px-3 py-1.5 rounded-full border border-[#5A5A40]/15">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium">{lastSavedText}</span>
            {isSaving && (
              <span className="text-[10px] text-[#D2691E] font-bold uppercase tracking-wider">
                • Sauvegarde...
              </span>
            )}
          </div>

          <div className="bg-white px-4 py-2 rounded-full shadow-xs border border-[#5A5A40]/20 flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-[#7a7a72] uppercase tracking-widest">
              Étape
            </span>
            <span className="text-sm font-bold text-[#D2691E]">01 / 03</span>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-xs rounded-3xl border border-[#5A5A40]/20 shadow-sm p-6 sm:p-10 space-y-8"
      >
        {/* Section 1: Identification */}
        <div>
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#5A5A40]/15 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif italic font-bold text-[#5A5A40]">
                Identité & Coordonnées
              </h3>
              <p className="text-xs text-[#7a7a72]">Vos coordonnées officielles pour le registre de la randonnée</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nom & Prénoms */}
            <div className={`sm:col-span-2 ${errors.fullName ? 'form-error-field' : ''}`}>
              <label htmlFor="fullName" className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a72] mb-1.5">
                Nom & Prénoms <span className="text-[#D2691E] font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  placeholder="Ex : KOUAME Kouassi Jean-Marc"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                    errors.fullName
                      ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 text-red-900'
                      : 'border-[#5A5A40]/25 bg-[#f5f2ed]/40 hover:bg-white focus:bg-white focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/20 text-[#2d2d2a]'
                  }`}
                />
              </div>
              {errors.fullName ? (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.fullName}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[#7a7a72]">Lettres et espaces uniquement</p>
              )}
            </div>

            {/* Église avec Autocomplétion */}
            <div className={`relative ${errors.church ? 'form-error-field' : ''}`}>
              <label htmlFor="church" className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a72] mb-1.5">
                Église d'appartenance <span className="text-[#D2691E] font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5A40]/60">
                  <Church className="w-4 h-4" />
                </div>
                <input
                  id="church"
                  type="text"
                  value={churchQuery}
                  onFocus={() => setShowChurchSuggestions(true)}
                  onChange={(e) => {
                    setChurchQuery(e.target.value);
                    updateField('church', e.target.value);
                    setShowChurchSuggestions(true);
                  }}
                  placeholder="Tapez le nom de votre église..."
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                    errors.church
                      ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 text-red-900'
                      : 'border-[#5A5A40]/25 bg-[#f5f2ed]/40 hover:bg-white focus:bg-white focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/20 text-[#2d2d2a]'
                  }`}
                />
              </div>

              {/* Suggestions dropdown */}
              {showChurchSuggestions && churchQuery.length > 0 && filteredChurches.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-[#5A5A40]/20 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-[#7a7a72] tracking-wider">
                    Suggestions rapides
                  </div>
                  {filteredChurches.map((churchName) => (
                    <button
                      type="button"
                      key={churchName}
                      onClick={() => {
                        setChurchQuery(churchName);
                        updateField('church', churchName);
                        setShowChurchSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-[#5A5A40]/10 text-[#2d2d2a] transition-colors flex items-center justify-between"
                    >
                      <span>{churchName}</span>
                      <Sparkles className="w-3 h-3 text-[#D2691E] opacity-70" />
                    </button>
                  ))}
                </div>
              )}

              {errors.church ? (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.church}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[#7a7a72]">Saisie libre ou choix dans la liste</p>
              )}
            </div>

            {/* Contact (Téléphone CI) */}
            <div className={errors.contact ? 'form-error-field' : ''}>
              <label htmlFor="contact" className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a72] mb-1.5">
                Numéro de Contact (WhatsApp / Appel) <span className="text-[#D2691E] font-bold">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A5A40] font-bold text-xs border-r border-[#5A5A40]/20 pr-2 my-2">
                  <span>+225</span>
                </div>
                <input
                  id="contact"
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => updateField('contact', e.target.value)}
                  placeholder="07 00 00 00 00"
                  className={`w-full pl-18 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                    errors.contact
                      ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 text-red-900'
                      : 'border-[#5A5A40]/25 bg-[#f5f2ed]/40 hover:bg-white focus:bg-white focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/20 text-[#2d2d2a]'
                  }`}
                />
              </div>
              {errors.contact ? (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.contact}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-[#7a7a72]">Format Côte d'Ivoire (10 chiffres)</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: District & Club */}
        <div>
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#5A5A40]/15 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center font-bold">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif italic font-bold text-[#5A5A40]">
                District & Affiliation
              </h3>
              <p className="text-xs text-[#7a7a72]">Votre organisation et club au sein du mouvement</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* District Dropdown */}
            <div className={errors.district || errors.districtOther ? 'form-error-field' : ''}>
              <label htmlFor="district" className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a72] mb-1.5">
                District <span className="text-[#D2691E] font-bold">*</span>
              </label>
              <select
                id="district"
                value={formData.district}
                onChange={(e) => updateField('district', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none bg-white ${
                  errors.district
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 text-red-900'
                    : 'border-[#5A5A40]/25 hover:border-[#5A5A40] focus:border-[#D2691E] focus:ring-2 focus:ring-[#D2691E]/20 text-[#2d2d2a]'
                }`}
              >
                <option value="">-- Sélectionnez votre district --</option>
                {DISTRICT_OPTIONS.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>

              {errors.district && (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.district}
                </p>
              )}

              {/* Champ conditionnel si Autre */}
              {formData.district === 'Autre' && (
                <div className="mt-3 p-3 bg-[#f5f2ed] rounded-xl border border-[#5A5A40]/20">
                  <label htmlFor="districtOther" className="block text-xs font-semibold text-[#5A5A40] mb-1">
                    Précisez votre district <span className="text-[#D2691E] font-bold">*</span>
                  </label>
                  <input
                    id="districtOther"
                    type="text"
                    value={formData.districtOther || ''}
                    onChange={(e) => updateField('districtOther', e.target.value)}
                    placeholder="Nom du district..."
                    className="w-full px-3 py-2 bg-white border border-[#5A5A40]/30 rounded-lg text-sm text-[#2d2d2a] focus:outline-none focus:border-[#D2691E]"
                  />
                  {errors.districtOther && (
                    <p className="mt-1 text-xs text-red-600">{errors.districtOther}</p>
                  )}
                </div>
              )}
            </div>

            {/* Club - Artistic Flair Pills */}
            <div className={errors.club || errors.clubOther ? 'form-error-field' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a72]">
                  Club d'appartenance (choix unique) <span className="text-[#D2691E] font-bold">*</span>
                </label>
                <span className="text-[11px] text-[#7a7a72]">Cliquez pour sélectionner</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {CLUB_OPTIONS.map((club) => {
                  const isSelected = formData.club === club.id;
                  return (
                    <button
                      type="button"
                      key={club.id}
                      onClick={() => updateField('club', club.id)}
                      className={`px-4 py-2 rounded-full border-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none ${
                        isSelected
                          ? 'border-[#D2691E] bg-[#D2691E] text-white shadow-sm'
                          : 'border-[#5A5A40] text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white bg-transparent'
                      }`}
                    >
                      <span>{club.label}</span>
                      <span className={`text-[10px] opacity-80 ${isSelected ? 'text-white' : 'text-[#7a7a72]'}`}>
                        ({club.desc})
                      </span>
                    </button>
                  );
                })}
              </div>

              {errors.club && (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.club}
                </p>
              )}

              {/* Champ conditionnel si Club == Autre */}
              {formData.club === 'Autre' && (
                <div className="mt-3 p-3 bg-[#f5f2ed] rounded-xl border border-[#5A5A40]/20">
                  <label htmlFor="clubOther" className="block text-xs font-semibold text-[#5A5A40] mb-1">
                    Précisez votre club / qualité <span className="text-[#D2691E] font-bold">*</span>
                  </label>
                  <input
                    id="clubOther"
                    type="text"
                    value={formData.clubOther || ''}
                    onChange={(e) => updateField('clubOther', e.target.value)}
                    placeholder="Ex : Sympathisant, Pasteur, Invité d'honneur..."
                    className="w-full px-3 py-2 bg-white border border-[#5A5A40]/30 rounded-lg text-sm text-[#2d2d2a] focus:outline-none focus:border-[#D2691E]"
                  />
                  {errors.clubOther && (
                    <p className="mt-1 text-xs text-red-600">{errors.clubOther}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Logistique & Santé */}
        <div>
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#5A5A40]/15 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center font-bold">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif italic font-bold text-[#5A5A40]">
                Équipement & Aptitude Médicale
              </h3>
              <p className="text-xs text-[#7a7a72]">Tee-shirt souvenir et protocole médical pour le parcours</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Taille Tee-Shirt (Artistic Buttons) */}
            <div className={errors.tshirtSizeOther ? 'form-error-field' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a7a72]">
                  Taille Tee-Shirt <span className="font-normal opacity-70">(Optionnel)</span>
                </label>
                <span className="text-[11px] text-[#7a7a72]">Pour le pack participant</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['XS', 'S', 'M', 'L', 'XL', 'XXL'] as TshirtSize[]).map((size) => {
                  const isSelected = formData.tshirtSize === size;
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() => updateField('tshirtSize', isSelected ? undefined : size)}
                      className={`w-11 h-11 border-2 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#D2691E] bg-[#D2691E] text-white shadow-xs'
                          : 'border-[#5A5A40]/30 text-[#5A5A40] hover:border-[#5A5A40] bg-transparent'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => updateField('tshirtSize', formData.tshirtSize === 'Autre' ? undefined : 'Autre')}
                  className={`px-3.5 h-11 border-2 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                    formData.tshirtSize === 'Autre'
                      ? 'border-[#D2691E] bg-[#D2691E] text-white shadow-xs'
                      : 'border-[#5A5A40]/30 text-[#5A5A40] hover:border-[#5A5A40] bg-transparent'
                  }`}
                >
                  Autre taille
                </button>
              </div>

              {formData.tshirtSize === 'Autre' && (
                <div className="mt-3 p-3 bg-[#f5f2ed] rounded-xl border border-[#5A5A40]/20">
                  <label htmlFor="tshirtSizeOther" className="block text-xs font-semibold text-[#5A5A40] mb-1">
                    Précisez la taille souhaitée <span className="text-[#D2691E] font-bold">*</span>
                  </label>
                  <input
                    id="tshirtSizeOther"
                    type="text"
                    value={formData.tshirtSizeOther || ''}
                    onChange={(e) => updateField('tshirtSizeOther', e.target.value)}
                    placeholder="Ex : 3XL, Enfant 8 ans..."
                    className="w-full px-3 py-2 bg-white border border-[#5A5A40]/30 rounded-lg text-sm text-[#2d2d2a] focus:outline-none focus:border-[#D2691E]"
                  />
                  {errors.tshirtSizeOther && (
                    <p className="mt-1 text-xs text-red-600">{errors.tshirtSizeOther}</p>
                  )}
                </div>
              )}
            </div>

            {/* Avez-vous une maladie quelconque ? (Non / Oui) */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${formData.hasIllness === 'Oui' ? 'bg-[#D2691E]/5 border-[#D2691E]/30' : 'bg-[#f5f2ed]/50 border-[#5A5A40]/20'} ${errors.hasIllness || errors.illnessDetails ? 'form-error-field' : ''}`}>
              <div className="flex items-start gap-2.5 mb-3">
                <Info className="w-4 h-4 text-[#D2691E] shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5A5A40]">
                    Avez-vous une maladie ou affection quelconque ? <span className="text-[#D2691E] font-bold">*</span>
                  </div>
                  <p className="text-[11px] text-[#7a7a72] mt-0.5">
                    Asthme, diabète, hypertension, allergie grave, etc. Nécessaire pour la sécurité médicale sur le circuit.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.hasIllness === 'Non' ? 'border-[#5A5A40] bg-[#5A5A40]' : 'border-[#5A5A40]/40 bg-white'
                  }`}>
                    {formData.hasIllness === 'Non' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <input
                    type="radio"
                    name="hasIllness"
                    value="Non"
                    checked={formData.hasIllness === 'Non'}
                    onChange={() => updateField('hasIllness', 'Non')}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-[#2d2d2a]">Non (Aucune affection)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.hasIllness === 'Oui' ? 'border-[#D2691E] bg-[#D2691E]' : 'border-[#5A5A40]/40 bg-white'
                  }`}>
                    {formData.hasIllness === 'Oui' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <input
                    type="radio"
                    name="hasIllness"
                    value="Oui"
                    checked={formData.hasIllness === 'Oui'}
                    onChange={() => updateField('hasIllness', 'Oui')}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold text-[#2d2d2a]">Oui (À préciser)</span>
                </label>
              </div>

              {errors.hasIllness && (
                <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.hasIllness}
                </p>
              )}

              {/* Dynamically displayed mandatory Details field if "Oui" */}
              {formData.hasIllness === 'Oui' && (
                <div className="mt-4 pt-3 border-t border-[#D2691E]/20">
                  <label htmlFor="illnessDetails" className="block text-xs font-bold text-[#5A5A40] mb-1.5">
                    Précisez votre maladie, affection ou traitement en cours <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="illnessDetails"
                    rows={2}
                    value={formData.illnessDetails || ''}
                    onChange={(e) => updateField('illnessDetails', e.target.value)}
                    placeholder="Ex : Asthmatique (j'aurai ma ventoline), Allergie piqûres d'insectes, etc."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D2691E]/40 rounded-xl text-sm text-[#2d2d2a] focus:outline-none focus:ring-2 focus:ring-[#D2691E]/20"
                  />
                  {errors.illnessDetails && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.illnessDetails}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-6 border-t border-[#5A5A40]/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#7a7a72] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Progression enregistrée automatiquement en temps réel</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#5A5A40] text-white hover:bg-[#484833] rounded-full uppercase tracking-widest text-xs font-bold shadow-lg shadow-[#5A5A40]/25 px-8 sm:px-10 py-4 transition-all duration-200 active:scale-[0.99] cursor-pointer"
          >
            <span>Continuer vers le paiement Wave</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
