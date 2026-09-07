import React, { useState } from 'react';
import {
  User,
  Church,
  Phone,
  Compass,
  Shirt,
  HeartPulse,
  ArrowRight,
  Info,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { FormConfig } from '../types.js';

interface FormLivePreviewProps {
  config: FormConfig;
  device?: 'desktop' | 'mobile';
}

export const FormLivePreview: React.FC<FormLivePreviewProps> = ({
  config,
  device = 'desktop',
}) => {
  // Test local preview state so the admin can interactively click and test controls
  const [testValues, setTestValues] = useState<Record<string, any>>({
    fullName: '',
    church: '',
    contact: '',
    district: config.districts[0] || '',
    club: config.clubs[0]?.id || '',
    tshirtSize: config.tshirtSizes[0] || '',
    hasIllness: 'Non',
    customFields: {},
  });

  const theme = config.theme || {
    primaryColor: '#5A5A40',
    accentColor: '#D2691E',
    backgroundColor: '#f5f2ed',
    cardBackgroundColor: '#ffffff',
    textColor: '#2d2d2a',
    borderRadius: 'rounded-3xl',
  };

  const header = config.header || {
    showBanner: true,
    bannerUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
    bannerHeight: 'medium',
    bannerOverlayOpacity: 35,
  };

  const bannerHeightClass =
    header.bannerHeight === 'compact'
      ? 'h-28 sm:h-36'
      : header.bannerHeight === 'tall'
      ? 'h-52 sm:h-64'
      : 'h-36 sm:h-48';

  const updateTestField = (field: string, val: any) => {
    setTestValues((prev) => ({ ...prev, [field]: val }));
  };

  const updateTestCustomField = (id: string, val: any) => {
    setTestValues((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [id]: val },
    }));
  };

  return (
    <div
      className={`transition-all duration-300 mx-auto ${
        device === 'mobile' ? 'max-w-sm shadow-2xl rounded-4xl border-8 border-stone-800 p-1 bg-stone-900' : 'w-full'
      }`}
    >
      {/* Mobile Frame Header indicator if on mobile device */}
      {device === 'mobile' && (
        <div className="flex justify-between items-center px-4 py-1.5 text-stone-400 text-[10px] font-mono">
          <span>09:41</span>
          <div className="w-16 h-3 bg-stone-800 rounded-full" />
          <span>5G • 98%</span>
        </div>
      )}

      {/* Main Preview Container with configured page background */}
      <div
        className="w-full rounded-2xl overflow-hidden transition-colors duration-200"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      >
        {/* Dynamic Header Banner */}
        {header.showBanner && header.bannerUrl && (
          <div className={`relative w-full ${bannerHeightClass} overflow-hidden`}>
            <img
              src={header.bannerUrl}
              alt="Bannière d'en-tête"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {/* Dark overlay with configurable opacity */}
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: (header.bannerOverlayOpacity || 30) / 100 }}
            />

            {/* Content inside Banner */}
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white">
              {header.logoUrl && (
                <div
                  className={`flex ${
                    header.logoPosition === 'center' ? 'justify-center' : 'justify-start'
                  }`}
                >
                  <img
                    src={header.logoUrl}
                    alt="Logo"
                    className="h-10 sm:h-12 w-auto object-contain drop-shadow-md rounded-lg bg-white/20 p-1 backdrop-blur-xs"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="mt-auto">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs"
                  style={{
                    backgroundColor: `${theme.accentColor}dd`,
                    color: '#ffffff',
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Officiel</span>
                </span>
                <h1 className="text-lg sm:text-2xl font-serif italic font-bold drop-shadow-sm mt-1 text-white">
                  {config.formTitle || 'Titre du formulaire'}
                </h1>
                {config.formSubtitle && (
                  <p className="text-xs sm:text-sm text-white/90 drop-shadow-xs line-clamp-1">
                    {config.formSubtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Wrapper */}
        <div className="p-3 sm:p-6 space-y-4">
          {/* Banner Notice if configured */}
          {config.bannerNotice && (
            <div
              className="p-3 rounded-xl flex items-start gap-2 text-xs border"
              style={{
                backgroundColor: `${theme.accentColor}15`,
                borderColor: `${theme.accentColor}40`,
                color: theme.textColor,
              }}
            >
              <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.accentColor }} />
              <p className="leading-snug">{config.bannerNotice}</p>
            </div>
          )}

          {/* Form Title bar if banner is not shown */}
          {!header.showBanner && (
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-0.5 w-6" style={{ backgroundColor: theme.accentColor }} />
                <span className="uppercase tracking-[0.2em] text-[9px] font-bold opacity-60">
                  Enregistrement
                </span>
              </div>
              <h2
                className="text-xl sm:text-2xl font-serif italic font-bold"
                style={{ color: theme.primaryColor }}
              >
                {config.formTitle}
              </h2>
              {config.formSubtitle && (
                <p className="text-xs opacity-75 mt-0.5">{config.formSubtitle}</p>
              )}
            </div>
          )}

          {/* Card Form Body */}
          <div
            className={`border shadow-xs p-4 sm:p-6 space-y-6 ${theme.borderRadius || 'rounded-3xl'}`}
            style={{
              backgroundColor: theme.cardBackgroundColor || '#ffffff',
              borderColor: `${theme.primaryColor}25`,
            }}
          >
            {/* Section 1: Coordonnées & Identité */}
            <div>
              <div
                className="flex items-center gap-2 pb-2.5 border-b mb-4"
                style={{ borderColor: `${theme.primaryColor}20` }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: `${theme.primaryColor}15`,
                    color: theme.primaryColor,
                  }}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3
                    className="text-sm sm:text-base font-serif italic font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    Identité & Coordonnées
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nom & Prénoms */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                    Nom & Prénoms <span style={{ color: theme.accentColor }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={testValues.fullName}
                    onChange={(e) => updateTestField('fullName', e.target.value)}
                    placeholder="Ex : KOUASSI Yao Emmanuel"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2"
                    style={{ focusRingColor: theme.accentColor }}
                  />
                </div>

                {/* Église / Structure (si activé) */}
                {config.enableChurchField !== false && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                      {config.churchLabel || 'Église locale / Paroisse'}{' '}
                      {config.requireChurchField !== false && (
                        <span style={{ color: theme.accentColor }}>*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={testValues.church}
                      onChange={(e) => updateTestField('church', e.target.value)}
                      placeholder="Ex : Temple du Jubilé (Cocody)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                    />
                  </div>
                )}

                {/* Contact téléphonique */}
                {config.enableContactField !== false && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                      {config.contactLabel || 'Téléphone / WhatsApp'}{' '}
                      <span style={{ color: theme.accentColor }}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={testValues.contact}
                      onChange={(e) => updateTestField('contact', e.target.value)}
                      placeholder="+225 07..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Districts & Équipes (si activé) */}
            {config.enableDistrictField !== false && config.districts && config.districts.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 pb-2.5 border-b mb-3"
                  style={{ borderColor: `${theme.primaryColor}20` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${theme.primaryColor}15`,
                      color: theme.primaryColor,
                    }}
                  >
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <h3
                    className="text-sm sm:text-base font-serif italic font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    District d’Origine
                  </h3>
                </div>

                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                  Sélectionnez votre district <span style={{ color: theme.accentColor }}>*</span>
                </label>
                <select
                  value={testValues.district}
                  onChange={(e) => updateTestField('district', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                >
                  {config.districts.map((d, idx) => (
                    <option key={idx} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {testValues.district === 'Autre' && (
                  <input
                    type="text"
                    placeholder="Précisez le nom de votre district..."
                    className="w-full mt-2 px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/40"
                  />
                )}
              </div>
            )}

            {/* Section 3: Clubs JA & Sections (si activé) */}
            {config.enableClubField !== false && config.clubs && config.clubs.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 pb-2.5 border-b mb-3"
                  style={{ borderColor: `${theme.primaryColor}20` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${theme.primaryColor}15`,
                      color: theme.primaryColor,
                    }}
                  >
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <h3
                    className="text-sm sm:text-base font-serif italic font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    Club / Catégorie de Jeunesse
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {config.clubs.map((c) => {
                    const isSelected = testValues.club === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => updateTestField('club', c.id)}
                        className={`p-2 rounded-xl text-left border transition-all text-xs ${
                          isSelected
                            ? 'font-bold shadow-xs'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: theme.primaryColor,
                                backgroundColor: `${theme.primaryColor}10`,
                                color: theme.primaryColor,
                              }
                            : {}
                        }
                      >
                        <div className="font-semibold text-xs truncate">{c.label}</div>
                        <div className="text-[9px] opacity-70 truncate">{c.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 4: Tailles de T-shirt (si activé) */}
            {config.enableTshirtField !== false && config.tshirtSizes && config.tshirtSizes.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 pb-2.5 border-b mb-3"
                  style={{ borderColor: `${theme.primaryColor}20` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${theme.primaryColor}15`,
                      color: theme.primaryColor,
                    }}
                  >
                    <Shirt className="w-3.5 h-3.5" />
                  </div>
                  <h3
                    className="text-sm sm:text-base font-serif italic font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    Taille du T-shirt officiel
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {config.tshirtSizes.map((size, idx) => {
                    const isSelected = testValues.tshirtSize === size;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateTestField('tshirtSize', size)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          isSelected ? 'shadow-xs' : 'border-stone-200 hover:bg-stone-50'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: theme.primaryColor,
                                borderColor: theme.primaryColor,
                                color: '#ffffff',
                              }
                            : { color: theme.textColor }
                        }
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 5: Champs Personnalisés créés de zéro */}
            {config.customFields && config.customFields.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 pb-2.5 border-b mb-4"
                  style={{ borderColor: `${theme.primaryColor}20` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${theme.accentColor}15`,
                      color: theme.accentColor,
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3
                    className="text-sm sm:text-base font-serif italic font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    Informations Spécifiques
                  </h3>
                </div>

                <div className="space-y-3.5">
                  {config.customFields.map((cf) => (
                    <div key={cf.id}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">
                        {cf.label} {cf.required && <span style={{ color: theme.accentColor }}>*</span>}
                      </label>

                      {cf.type === 'select' ? (
                        <select
                          value={testValues.customFields[cf.id] || ''}
                          onChange={(e) => updateTestCustomField(cf.id, e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                        >
                          <option value="">-- Choisir une option --</option>
                          {cf.options?.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : cf.type === 'radio' ? (
                        <div className="space-y-1.5 pt-0.5">
                          {cf.options?.map((opt, oIdx) => (
                            <label
                              key={oIdx}
                              className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded-lg hover:bg-stone-50"
                            >
                              <input
                                type="radio"
                                name={`custom_${cf.id}`}
                                value={opt}
                                checked={testValues.customFields[cf.id] === opt}
                                onChange={() => updateTestCustomField(cf.id, opt)}
                                className="accent-stone-800"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : cf.type === 'checkbox' ? (
                        <label className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded-lg hover:bg-stone-50">
                          <input
                            type="checkbox"
                            checked={!!testValues.customFields[cf.id]}
                            onChange={(e) => updateTestCustomField(cf.id, e.target.checked)}
                            className="accent-stone-800 rounded"
                          />
                          <span>{cf.placeholder || cf.label}</span>
                        </label>
                      ) : cf.type === 'textarea' ? (
                        <textarea
                          rows={2}
                          value={testValues.customFields[cf.id] || ''}
                          onChange={(e) => updateTestCustomField(cf.id, e.target.value)}
                          placeholder={cf.placeholder || ''}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                        />
                      ) : (
                        <input
                          type={cf.type || 'text'}
                          value={testValues.customFields[cf.id] || ''}
                          onChange={(e) => updateTestCustomField(cf.id, e.target.value)}
                          placeholder={cf.placeholder || ''}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none"
                        />
                      )}

                      {cf.helpText && (
                        <p className="text-[10px] text-stone-500 mt-1">{cf.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: Médical (si activé) */}
            {config.enableIllnessField !== false && (
              <div>
                <div
                  className="flex items-center gap-2 pb-2.5 border-b mb-3"
                  style={{ borderColor: `${theme.primaryColor}20` }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: `${theme.primaryColor}15`,
                      color: theme.primaryColor,
                    }}
                  >
                    <HeartPulse className="w-3.5 h-3.5" />
                  </div>
                  <h3
                    className="text-sm sm:text-base font-serif italic font-bold"
                    style={{ color: theme.primaryColor }}
                  >
                    Fiche Médicale & Aptitude
                  </h3>
                </div>

                <label className="block text-xs font-medium mb-2">
                  {config.illnessLabel || 'Avez-vous des antécédents médicaux ou allergies ?'}{' '}
                  {config.requireIllnessField && <span style={{ color: theme.accentColor }}>*</span>}
                </label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="hasIllnessPreview"
                      value="Non"
                      checked={testValues.hasIllness === 'Non'}
                      onChange={() => updateTestField('hasIllness', 'Non')}
                    />
                    <span>Non, aucun problème signalé</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="radio"
                      name="hasIllnessPreview"
                      value="Oui"
                      checked={testValues.hasIllness === 'Oui'}
                      onChange={() => updateTestField('hasIllness', 'Oui')}
                    />
                    <span>Oui, à préciser</span>
                  </label>
                </div>
                {testValues.hasIllness === 'Oui' && (
                  <textarea
                    rows={2}
                    placeholder="Précisez la nature de votre condition médicale..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-amber-300 bg-amber-50/40"
                  />
                )}
                {config.illnessHelpText && (
                  <p className="text-[10px] text-stone-500 mt-1">{config.illnessHelpText}</p>
                )}
              </div>
            )}

            {/* Terms Notice */}
            {config.termsNotice && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>{config.termsNotice}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="button"
                className={`w-full py-3 px-4 text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  theme.borderRadius || 'rounded-3xl'
                }`}
                style={{
                  backgroundColor: theme.accentColor,
                  color: '#ffffff',
                }}
              >
                <span>{config.submitButtonText || 'Valider mon Inscription'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
