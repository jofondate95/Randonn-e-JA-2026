import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Church,
  Compass,
  Shirt,
  HeartPulse,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import {
  RegistrationFormData,
  ClubType,
  TshirtSize,
  FormConfig,
  DEFAULT_OFFICIAL_DISTRICTS,
} from '../types.js';

interface RegistrationFormProps {
  initialData: RegistrationFormData;
  onSubmit: (data: RegistrationFormData) => void;
  onAutoSave: (data: RegistrationFormData) => void;
  lastSavedText: string;
  isSaving: boolean;
  onShareClick?: () => void;
  formConfig?: FormConfig;
}

const FALLBACK_CLUB_OPTIONS: { id: ClubType; label: string; desc: string }[] = [
  { id: 'Aventurier', label: 'Aventurier', desc: '6 à 9 ans' },
  { id: 'Éclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
  { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
  { id: 'Aîné', label: 'Aîné', desc: 'Jeunes Adultes' },
  { id: 'Chef Guide', label: 'Chef Guide', desc: 'Cadres & Formateurs' },
  { id: 'Leader de Jeunesse', label: 'Leader de Jeunesse', desc: 'Responsables' },
  { id: 'Autre', label: 'Autre', desc: 'Sympathisant / Invité' },
];

const FALLBACK_TSHIRT_OPTIONS: TshirtSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Autre'];

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
  formConfig,
}) => {
  const [formData, setFormData] = useState<RegistrationFormData>(() => ({
    ...initialData,
    customFields: initialData.customFields || {},
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [churchQuery, setChurchQuery] = useState(initialData.church || '');
  const [showChurchSuggestions, setShowChurchSuggestions] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Dynamic Theme configuration
  const theme = formConfig?.theme || {
    primaryColor: '#5A5A40',
    accentColor: '#D2691E',
    backgroundColor: '#f5f2ed',
    cardBackgroundColor: '#ffffff',
    textColor: '#2d2d2a',
    borderRadius: 'rounded-3xl',
  };

  // Dynamic Header configuration
  const header = formConfig?.header || {
    showBanner: true,
    bannerUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
    bannerHeight: 'medium',
    bannerOverlayOpacity: 35,
    logoUrl: '',
    logoPosition: 'left',
  };

  const bannerHeightClass =
    header.bannerHeight === 'compact'
      ? 'h-36 sm:h-44'
      : header.bannerHeight === 'tall'
      ? 'h-60 sm:h-80'
      : 'h-48 sm:h-64';

  const districtOptions = useMemo(() => {
    if (formConfig?.districts && formConfig.districts.length > 0) {
      return formConfig.districts;
    }
    return DEFAULT_OFFICIAL_DISTRICTS;
  }, [formConfig?.districts]);

  const clubOptions = useMemo(() => {
    if (formConfig?.clubs && formConfig.clubs.length > 0) {
      return formConfig.clubs;
    }
    return FALLBACK_CLUB_OPTIONS;
  }, [formConfig?.clubs]);

  const tshirtOptions = useMemo(() => {
    if (formConfig?.tshirtSizes && formConfig.tshirtSizes.length > 0) {
      return formConfig.tshirtSizes;
    }
    return FALLBACK_TSHIRT_OPTIONS;
  }, [formConfig?.tshirtSizes]);

  // Sync state if initialData changes externally
  useEffect(() => {
    setFormData({
      ...initialData,
      customFields: initialData.customFields || {},
    });
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

  const updateCustomField = (id: string, value: any) => {
    setHasInteracted(true);
    setFormData((prev) => ({
      ...prev,
      customFields: {
        ...(prev.customFields || {}),
        [id]: value,
      },
    }));
    if (errors[`custom_${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`custom_${id}`];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Nom & Prénoms: obligatoire
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Le nom et les prénoms sont obligatoires (au moins 2 caractères).';
    } else if (!/^[\p{L}\s'’-]+$/u.test(formData.fullName.trim())) {
      newErrors.fullName = 'Veuillez saisir un nom valide (uniquement lettres et espaces).';
    }

    // Église si activée et obligatoire
    if (formConfig?.enableChurchField !== false && formConfig?.requireChurchField !== false) {
      if (!formData.church || formData.church.trim().length < 2) {
        newErrors.church = "Ce champ est obligatoire.";
      }
    }

    // Contact si activé
    if (formConfig?.enableContactField !== false) {
      const rawContact = (formData.contact || '').replace(/\s+/g, '');
      if (!rawContact) {
        newErrors.contact = 'Le numéro de contact est obligatoire.';
      } else if (
        !/^(\+225)?[0-9]{10}$/.test(rawContact) &&
        !/^0[157][0-9]{8}$/.test(rawContact) &&
        rawContact.length < 8
      ) {
        newErrors.contact = 'Veuillez entrer un numéro valide (+225 XX XX XX XX XX).';
      }
    }

    // District si activé
    if (formConfig?.enableDistrictField !== false) {
      if (!formData.district) {
        newErrors.district = 'Veuillez sélectionner votre district.';
      } else if (formData.district === 'Autre' && !formData.districtOther?.trim()) {
        newErrors.districtOther = 'Veuillez préciser le nom de votre district.';
      }
    }

    // Club si activé
    if (formConfig?.enableClubField !== false) {
      if (!formData.club) {
        newErrors.club = 'Veuillez choisir votre club ou groupe.';
      } else if (formData.club === 'Autre' && !formData.clubOther?.trim()) {
        newErrors.clubOther = 'Veuillez préciser votre club.';
      }
    }

    // Taille T-shirt si activé et requis
    if (formConfig?.enableTshirtField !== false && formConfig?.requireTshirt) {
      if (!formData.tshirtSize) {
        newErrors.tshirtSize = 'Veuillez choisir une taille de tee-shirt.';
      } else if (formData.tshirtSize === 'Autre' && !formData.tshirtSizeOther?.trim()) {
        newErrors.tshirtSizeOther = 'Veuillez préciser votre taille de tee-shirt.';
      }
    }

    // Maladie si activé
    if (formConfig?.enableIllnessField !== false) {
      if (formConfig?.requireIllnessField && !formData.hasIllness) {
        newErrors.hasIllness = 'Ce champ est obligatoire.';
      } else if (formData.hasIllness === 'Oui' && !formData.illnessDetails?.trim()) {
        newErrors.illnessDetails = 'Veuillez préciser votre affection ou allergie médicale pour votre sécurité.';
      }
    }

    // Validation des Champs Personnalisés
    if (formConfig?.customFields && Array.isArray(formConfig.customFields)) {
      for (const cf of formConfig.customFields) {
        if (cf.required) {
          const val = formData.customFields?.[cf.id];
          if (val === undefined || val === null || (typeof val === 'string' && !val.trim()) || (cf.type === 'checkbox' && !val)) {
            newErrors[`custom_${cf.id}`] = `Le champ « ${cf.label} » est obligatoire.`;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    } else {
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-6">
      {/* Dynamic Banner Notice if configured by Admin */}
      {formConfig?.bannerNotice && (
        <div
          className="p-4 rounded-2xl flex items-start gap-3 border shadow-2xs"
          style={{
            backgroundColor: `${theme.accentColor}12`,
            borderColor: `${theme.accentColor}35`,
          }}
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: theme.accentColor }} />
          <p className="text-xs sm:text-sm font-medium" style={{ color: theme.textColor }}>
            {formConfig.bannerNotice}
          </p>
        </div>
      )}

      {/* Dynamic Header Image Banner */}
      {header.showBanner && header.bannerUrl && (
        <div
          className={`relative w-full ${bannerHeightClass} overflow-hidden shadow-md ${
            theme.borderRadius || 'rounded-3xl'
          }`}
        >
          <img
            src={header.bannerUrl}
            alt="Bannière officielle"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: (header.bannerOverlayOpacity ?? 35) / 100 }}
          />

          {/* Banner text & logo overlay */}
          <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-between text-white">
            {header.logoUrl && (
              <div
                className={`flex ${
                  header.logoPosition === 'center' ? 'justify-center' : 'justify-start'
                }`}
              >
                <img
                  src={header.logoUrl}
                  alt="Logo officiel"
                  className="h-12 sm:h-16 w-auto object-contain drop-shadow-md rounded-xl bg-white/20 p-1.5 backdrop-blur-xs"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="mt-auto">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-xs mb-1.5"
                style={{
                  backgroundColor: `${theme.accentColor}dd`,
                  color: '#ffffff',
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Officiel • Inscriptions Ouvertes</span>
              </span>
              <h1 className="text-2xl sm:text-4xl font-serif italic font-bold drop-shadow-md text-white">
                {formConfig?.formTitle || "Formulaire d'inscription"}
              </h1>
              {formConfig?.formSubtitle && (
                <p className="text-xs sm:text-base text-white/90 drop-shadow-xs mt-1 max-w-2xl">
                  {formConfig.formSubtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header bar with Step Badge and Auto-Save Status (if banner is hidden or minimal) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!header.showBanner && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-0.5 w-6" style={{ backgroundColor: theme.accentColor }} />
              <span className="uppercase tracking-[0.25em] text-[10px] font-bold opacity-60">
                Étape Première
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl font-serif italic font-bold"
              style={{ color: theme.primaryColor }}
            >
              {formConfig?.formTitle || "Formulaire d'inscription"}
            </h2>
            <p className="text-xs sm:text-sm opacity-70 mt-0.5">
              {formConfig?.formSubtitle || "Veuillez renseigner vos informations personnelles pour réserver votre place."}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {onShareClick && (
            <button
              type="button"
              onClick={onShareClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 border border-stone-200 transition-all shadow-2xs cursor-pointer"
              style={{ color: theme.primaryColor }}
              title="Obtenir le lien simplifié et QR Code du formulaire"
            >
              <Share2 className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
              <span className="hidden sm:inline">Lien simplifié</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-medium bg-white/90 px-3.5 py-1.5 rounded-full border border-stone-200 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium">{lastSavedText}</span>
            {isSaving && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: theme.accentColor }}
              >
                • Sauvegarde...
              </span>
            )}
          </div>

          <div className="bg-white px-4 py-1.5 rounded-full shadow-2xs border border-stone-200 flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              Étape
            </span>
            <span className="text-sm font-bold" style={{ color: theme.accentColor }}>
              01 / 03
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Card with Configured Styles */}
      <form
        onSubmit={handleSubmit}
        className={`border shadow-sm p-6 sm:p-10 space-y-8 ${theme.borderRadius || 'rounded-3xl'}`}
        style={{
          backgroundColor: theme.cardBackgroundColor || '#ffffff',
          borderColor: `${theme.primaryColor}20`,
        }}
      >
        {/* Section 1: Identification & Coordonnées */}
        <div>
          <div
            className="flex items-center gap-2.5 pb-3 border-b mb-6"
            style={{ borderColor: `${theme.primaryColor}20` }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{
                backgroundColor: `${theme.primaryColor}15`,
                color: theme.primaryColor,
              }}
            >
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3
                className="text-base sm:text-lg font-serif italic font-bold"
                style={{ color: theme.primaryColor }}
              >
                Identité & Coordonnées
              </h3>
              <p className="text-xs text-stone-500">
                Vos coordonnées officielles pour le registre des participants
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nom & Prénoms */}
            <div className={`sm:col-span-2 ${errors.fullName ? 'form-error-field' : ''}`}>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
                Nom & Prénoms <span style={{ color: theme.accentColor }}>*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                placeholder="Ex : KOUAME Kouassi Jean-Marc"
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                  errors.fullName
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 text-red-900'
                    : 'border-stone-300 bg-stone-50/40 hover:bg-white focus:bg-white focus:ring-2'
                }`}
                style={{ color: theme.textColor }}
              />
              {errors.fullName ? (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.fullName}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-stone-400">Lettres et espaces uniquement</p>
              )}
            </div>

            {/* Église avec Autocomplétion (si activé) */}
            {formConfig?.enableChurchField !== false && (
              <div className={`relative ${errors.church ? 'form-error-field' : ''}`}>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
                  {formConfig?.churchLabel || "Église d'appartenance"}{' '}
                  {formConfig?.requireChurchField !== false && (
                    <span style={{ color: theme.accentColor }}>*</span>
                  )}
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none opacity-60"
                    style={{ color: theme.primaryColor }}
                  >
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
                        : 'border-stone-300 bg-stone-50/40 hover:bg-white focus:bg-white focus:ring-2'
                    }`}
                    style={{ color: theme.textColor }}
                  />
                </div>

                {/* Suggestions dropdown */}
                {showChurchSuggestions && churchQuery.length > 0 && filteredChurches.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
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
                        className="w-full text-left px-3 py-2 text-xs hover:bg-stone-100 transition-colors flex items-center justify-between"
                        style={{ color: theme.textColor }}
                      >
                        <span>{churchName}</span>
                        <Sparkles className="w-3 h-3 opacity-70" style={{ color: theme.accentColor }} />
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
                  <p className="mt-1 text-[11px] text-stone-400">Saisie libre ou choix dans la liste</p>
                )}
              </div>
            )}

            {/* Contact (si activé) */}
            {formConfig?.enableContactField !== false && (
              <div className={errors.contact ? 'form-error-field' : ''}>
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
                  {formConfig?.contactLabel || 'Numéro de Contact (WhatsApp / Appel)'}{' '}
                  <span style={{ color: theme.accentColor }}>*</span>
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-bold text-xs border-r border-stone-200 pr-2 my-2"
                    style={{ color: theme.primaryColor }}
                  >
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
                        : 'border-stone-300 bg-stone-50/40 hover:bg-white focus:bg-white focus:ring-2'
                    }`}
                    style={{ color: theme.textColor }}
                  />
                </div>
                {errors.contact ? (
                  <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.contact}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-stone-400">Format Côte d'Ivoire (10 chiffres)</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: District & Affiliation (si activé) */}
        {formConfig?.enableDistrictField !== false && districtOptions.length > 0 && (
          <div>
            <div
              className="flex items-center gap-2.5 pb-3 border-b mb-6"
              style={{ borderColor: `${theme.primaryColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                }}
              >
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-serif italic font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  District d'Origine
                </h3>
                <p className="text-xs text-stone-500">
                  Votre zone de rattachement ou district officiel
                </p>
              </div>
            </div>

            <div className={errors.district || errors.districtOther ? 'form-error-field' : ''}>
              <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
                District <span style={{ color: theme.accentColor }}>*</span>
              </label>
              <select
                id="district"
                value={formData.district}
                onChange={(e) => updateField('district', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none bg-white ${
                  errors.district
                    ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-200 text-red-900'
                    : 'border-stone-300 hover:border-stone-400 focus:ring-2'
                }`}
                style={{ color: theme.textColor }}
              >
                <option value="">-- Sélectionnez votre district --</option>
                {districtOptions.map((dist) => (
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
                <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Précisez votre district <span style={{ color: theme.accentColor }}>*</span>
                  </label>
                  <input
                    id="districtOther"
                    type="text"
                    value={formData.districtOther || ''}
                    onChange={(e) => updateField('districtOther', e.target.value)}
                    placeholder="Nom du district..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none"
                    style={{ color: theme.textColor }}
                  />
                  {errors.districtOther && (
                    <p className="mt-1 text-xs text-red-600">{errors.districtOther}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 3: Club d'appartenance (si activé) */}
        {formConfig?.enableClubField !== false && clubOptions.length > 0 && (
          <div>
            <div
              className="flex items-center gap-2.5 pb-3 border-b mb-6"
              style={{ borderColor: `${theme.primaryColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                }}
              >
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-serif italic font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  Club / Catégorie de Jeunesse
                </h3>
                <p className="text-xs text-stone-500">Votre affiliation de club ou tranche d'âge</p>
              </div>
            </div>

            <div className={errors.club || errors.clubOther ? 'form-error-field' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  Club d'appartenance (choix unique) <span style={{ color: theme.accentColor }}>*</span>
                </label>
                <span className="text-[11px] text-stone-400">Cliquez pour sélectionner</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {clubOptions.map((club) => {
                  const isSelected = formData.club === club.id;
                  return (
                    <button
                      type="button"
                      key={club.id}
                      onClick={() => updateField('club', club.id as ClubType)}
                      className={`px-4 py-2 rounded-full border-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 select-none ${
                        isSelected ? 'shadow-xs' : 'hover:bg-stone-50 bg-transparent'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: theme.accentColor,
                              backgroundColor: theme.accentColor,
                              color: '#ffffff',
                            }
                          : {
                              borderColor: `${theme.primaryColor}50`,
                              color: theme.primaryColor,
                            }
                      }
                    >
                      <span>{club.label}</span>
                      <span className={`text-[10px] ${isSelected ? 'text-white/90' : 'opacity-70'}`}>
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

              {/* Champ conditionnel si Autre */}
              {formData.club === 'Autre' && (
                <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Précisez votre club / qualité <span style={{ color: theme.accentColor }}>*</span>
                  </label>
                  <input
                    id="clubOther"
                    type="text"
                    value={formData.clubOther || ''}
                    onChange={(e) => updateField('clubOther', e.target.value)}
                    placeholder="Ex : Sympathisant, Pasteur, Invité d'honneur..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none"
                    style={{ color: theme.textColor }}
                  />
                  {errors.clubOther && (
                    <p className="mt-1 text-xs text-red-600">{errors.clubOther}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 4: Tailles de T-shirts (si activé) */}
        {formConfig?.enableTshirtField !== false && tshirtOptions.length > 0 && (
          <div>
            <div
              className="flex items-center gap-2.5 pb-3 border-b mb-6"
              style={{ borderColor: `${theme.primaryColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                }}
              >
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-serif italic font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  Taille du T-Shirt Officiel
                </h3>
                <p className="text-xs text-stone-500">Pour votre équipement officiel</p>
              </div>
            </div>

            <div className={errors.tshirtSize || errors.tshirtSizeOther ? 'form-error-field' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
                  Taille Tee-Shirt{' '}
                  {formConfig?.requireTshirt ? (
                    <span style={{ color: theme.accentColor }}>*</span>
                  ) : (
                    <span className="font-normal opacity-70">(Optionnel)</span>
                  )}
                </label>
                <span className="text-[11px] text-stone-400">Pour le pack participant</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tshirtOptions.map((size) => {
                  const isSelected = formData.tshirtSize === size;
                  return (
                    <button
                      type="button"
                      key={size}
                      onClick={() =>
                        updateField('tshirtSize', isSelected ? undefined : (size as TshirtSize))
                      }
                      className={`min-w-11 h-11 px-3 border-2 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${
                        isSelected ? 'shadow-xs' : 'hover:bg-stone-50 bg-transparent'
                      }`}
                      style={
                        isSelected
                          ? {
                              borderColor: theme.accentColor,
                              backgroundColor: theme.accentColor,
                              color: '#ffffff',
                            }
                          : {
                              borderColor: `${theme.primaryColor}40`,
                              color: theme.primaryColor,
                            }
                      }
                    >
                      {size}
                    </button>
                  );
                })}
              </div>

              {errors.tshirtSize && (
                <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.tshirtSize}
                </p>
              )}

              {formData.tshirtSize === 'Autre' && (
                <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Précisez la taille souhaitée <span style={{ color: theme.accentColor }}>*</span>
                  </label>
                  <input
                    id="tshirtSizeOther"
                    type="text"
                    value={formData.tshirtSizeOther || ''}
                    onChange={(e) => updateField('tshirtSizeOther', e.target.value)}
                    placeholder="Ex : 3XL, Enfant 8 ans, Sur-mesure..."
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg text-sm focus:outline-none"
                    style={{ color: theme.textColor }}
                  />
                  {errors.tshirtSizeOther && (
                    <p className="mt-1 text-xs text-red-600">{errors.tshirtSizeOther}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5: Champs Personnalisés créés via le CMS */}
        {formConfig?.customFields && formConfig.customFields.length > 0 && (
          <div>
            <div
              className="flex items-center gap-2.5 pb-3 border-b mb-6"
              style={{ borderColor: `${theme.primaryColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: `${theme.accentColor}15`,
                  color: theme.accentColor,
                }}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-serif italic font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  Informations Complémentaires
                </h3>
                <p className="text-xs text-stone-500">Renseignements spécifiques à l'événement</p>
              </div>
            </div>

            <div className="space-y-5">
              {formConfig.customFields.map((cf) => {
                const fieldError = errors[`custom_${cf.id}`];
                const value = formData.customFields?.[cf.id] ?? '';

                return (
                  <div key={cf.id} className={fieldError ? 'form-error-field' : ''}>
                    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 mb-1.5">
                      {cf.label} {cf.required && <span style={{ color: theme.accentColor }}>*</span>}
                    </label>

                    {cf.type === 'select' ? (
                      <select
                        value={value}
                        onChange={(e) => updateCustomField(cf.id, e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none bg-white ${
                          fieldError ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                        }`}
                        style={{ color: theme.textColor }}
                      >
                        <option value="">-- Choisissez une option --</option>
                        {cf.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : cf.type === 'radio' ? (
                      <div className="space-y-2 pt-1">
                        {cf.options?.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded-xl hover:bg-stone-50 border border-stone-200"
                          >
                            <input
                              type="radio"
                              name={`custom_${cf.id}`}
                              value={opt}
                              checked={value === opt}
                              onChange={() => updateCustomField(cf.id, opt)}
                              className="accent-stone-800"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : cf.type === 'checkbox' ? (
                      <label className="flex items-center gap-3 text-sm cursor-pointer p-3 rounded-xl border border-stone-200 hover:bg-stone-50">
                        <input
                          type="checkbox"
                          checked={!!value}
                          onChange={(e) => updateCustomField(cf.id, e.target.checked)}
                          className="w-4 h-4 accent-stone-800 rounded"
                        />
                        <span className="font-medium text-stone-800">{cf.placeholder || cf.label}</span>
                      </label>
                    ) : cf.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        value={value}
                        onChange={(e) => updateCustomField(cf.id, e.target.value)}
                        placeholder={cf.placeholder || ''}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                          fieldError ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                        }`}
                        style={{ color: theme.textColor }}
                      />
                    ) : (
                      <input
                        type={cf.type || 'text'}
                        value={value}
                        onChange={(e) => updateCustomField(cf.id, e.target.value)}
                        placeholder={cf.placeholder || ''}
                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none ${
                          fieldError ? 'border-red-400 bg-red-50/20' : 'border-stone-300'
                        }`}
                        style={{ color: theme.textColor }}
                      />
                    )}

                    {cf.helpText && (
                      <p className="mt-1 text-[11px] text-stone-400">{cf.helpText}</p>
                    )}

                    {fieldError && (
                      <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fieldError}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 6: Logistique & Santé (si activé) */}
        {formConfig?.enableIllnessField !== false && (
          <div>
            <div
              className="flex items-center gap-2.5 pb-3 border-b mb-6"
              style={{ borderColor: `${theme.primaryColor}20` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
                style={{
                  backgroundColor: `${theme.primaryColor}15`,
                  color: theme.primaryColor,
                }}
              >
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className="text-base sm:text-lg font-serif italic font-bold"
                  style={{ color: theme.primaryColor }}
                >
                  Aptitude & Sécurité Médicale
                </h3>
                <p className="text-xs text-stone-500">
                  Protocole de premiers secours et sécurité sur le circuit
                </p>
              </div>
            </div>

            <div
              className={`p-4 sm:p-5 rounded-2xl border ${
                formData.hasIllness === 'Oui' ? 'border-amber-400 bg-amber-50/40' : 'border-stone-200 bg-stone-50/50'
              } ${errors.hasIllness || errors.illnessDetails ? 'form-error-field' : ''}`}
            >
              <div className="flex items-start gap-2.5 mb-3">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-700">
                    {formConfig?.illnessLabel || 'Avez-vous une maladie ou affection quelconque ?'}{' '}
                    {formConfig?.requireIllnessField && (
                      <span style={{ color: theme.accentColor }}>*</span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    {formConfig?.illnessHelpText ||
                      'Asthme, diabète, hypertension, allergie grave, etc. Nécessaire pour la sécurité médicale.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.hasIllness === 'Non' ? 'bg-stone-900 border-stone-900' : 'border-stone-400 bg-white'
                    }`}
                  >
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
                  <span className="text-sm font-semibold" style={{ color: theme.textColor }}>
                    Non (Aucune affection)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      formData.hasIllness === 'Oui' ? 'shadow-xs' : 'border-stone-400 bg-white'
                    }`}
                    style={
                      formData.hasIllness === 'Oui'
                        ? {
                            backgroundColor: theme.accentColor,
                            borderColor: theme.accentColor,
                          }
                        : {}
                    }
                  >
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
                  <span className="text-sm font-semibold" style={{ color: theme.textColor }}>
                    Oui (À préciser)
                  </span>
                </label>
              </div>

              {errors.hasIllness && (
                <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.hasIllness}
                </p>
              )}

              {/* Champ obligatoire si "Oui" */}
              {formData.hasIllness === 'Oui' && (
                <div className="mt-4 pt-3 border-t border-amber-200">
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Précisez votre maladie, affection ou traitement en cours{' '}
                    <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="illnessDetails"
                    rows={2}
                    value={formData.illnessDetails || ''}
                    onChange={(e) => updateField('illnessDetails', e.target.value)}
                    placeholder="Ex : Asthmatique (j'aurai ma ventoline), Allergie piqûres d'insectes, etc."
                    className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    style={{ color: theme.textColor }}
                  />
                  {errors.illnessDetails && (
                    <p className="mt-1 text-xs text-red-600 font-medium">{errors.illnessDetails}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Terms / Aptitude Notice if configured */}
        {formConfig?.termsNotice && (
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formConfig.termsNotice}</span>
          </div>
        )}

        {/* Action Submit button styled dynamically with accentColor */}
        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-400 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Progression enregistrée automatiquement en temps réel</span>
          </div>

          <button
            type="submit"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 uppercase tracking-widest text-xs font-bold shadow-lg px-8 sm:px-10 py-4 transition-all duration-200 active:scale-[0.99] cursor-pointer text-white ${
              theme.borderRadius || 'rounded-full'
            }`}
            style={{
              backgroundColor: theme.accentColor,
            }}
          >
            <span>{formConfig?.submitButtonText || 'Continuer vers le paiement Wave'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
