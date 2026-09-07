import React, { useState, useRef } from 'react';
import {
  Palette,
  Image as ImageIcon,
  Compass,
  Users,
  Shirt,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Save,
  AlertCircle,
  Eye,
  Smartphone,
  Monitor,
  Columns,
  UploadCloud,
  Sparkles,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  Layers,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  X,
  Type,
  FileText,
  Church,
} from 'lucide-react';
import { FormConfig, FormClubOption, FormCustomField, DEFAULT_OFFICIAL_DISTRICTS } from '../types.js';
import { FormLivePreview } from './FormLivePreview.js';
import {
  THEME_PRESETS,
  CURATED_BANNER_IMAGES,
  TEMPLATE_BANCO_HIKE,
  TEMPLATE_CHURCH_EVENT,
  TEMPLATE_YOUTH_CAMP,
  TEMPLATE_BLANK,
} from '../utils/formTemplates.js';

interface FormCmsTabProps {
  token: string;
  initialConfig?: FormConfig;
  onConfigSaved?: (savedConfig: FormConfig) => void;
}

export const FormCmsTab: React.FC<FormCmsTabProps> = ({
  token,
  initialConfig,
  onConfigSaved,
}) => {
  // Normalize configuration with robust fallbacks
  const getCleanConfig = (cfg?: FormConfig): FormConfig => {
    return {
      districts: cfg?.districts && cfg.districts.length > 0 ? [...cfg.districts] : [...DEFAULT_OFFICIAL_DISTRICTS],
      tshirtSizes: cfg?.tshirtSizes && cfg.tshirtSizes.length > 0 ? [...cfg.tshirtSizes] : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Autre'],
      clubs: cfg?.clubs && cfg.clubs.length > 0 ? [...cfg.clubs] : [...TEMPLATE_BANCO_HIKE.clubs],
      bannerNotice: cfg?.bannerNotice || '',
      formTitle: cfg?.formTitle || "Formulaire d'inscription",
      formSubtitle: cfg?.formSubtitle || "Veuillez renseigner vos informations personnelles pour réserver votre place.",
      termsNotice: cfg?.termsNotice || "Je certifie être apte physiquement à la marche en forêt et m'engage à respecter les consignes de sécurité.",
      submitButtonText: cfg?.submitButtonText || "Continuer vers le Paiement (5 050 FCFA)",
      theme: {
        primaryColor: cfg?.theme?.primaryColor || '#5A5A40',
        accentColor: cfg?.theme?.accentColor || '#D2691E',
        backgroundColor: cfg?.theme?.backgroundColor || '#f5f2ed',
        cardBackgroundColor: cfg?.theme?.cardBackgroundColor || '#ffffff',
        textColor: cfg?.theme?.textColor || '#2d2d2a',
        borderRadius: cfg?.theme?.borderRadius || 'rounded-3xl',
      },
      header: {
        showBanner: cfg?.header?.showBanner !== undefined ? cfg.header.showBanner : true,
        bannerUrl: cfg?.header?.bannerUrl || 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
        bannerHeight: cfg?.header?.bannerHeight || 'medium',
        bannerOverlayOpacity: cfg?.header?.bannerOverlayOpacity !== undefined ? cfg.header.bannerOverlayOpacity : 35,
        logoUrl: cfg?.header?.logoUrl || '',
        logoPosition: cfg?.header?.logoPosition || 'left',
      },
      customFields: cfg?.customFields ? [...cfg.customFields] : [],
      enableDistrictField: cfg?.enableDistrictField !== undefined ? cfg.enableDistrictField : true,
      allowDistrictOther: cfg?.allowDistrictOther !== undefined ? cfg.allowDistrictOther : true,
      enableClubField: cfg?.enableClubField !== undefined ? cfg.enableClubField : true,
      allowClubOther: cfg?.allowClubOther !== undefined ? cfg.allowClubOther : true,
      enableTshirtField: cfg?.enableTshirtField !== undefined ? cfg.enableTshirtField : true,
      allowTshirtOther: cfg?.allowTshirtOther !== undefined ? cfg.allowTshirtOther : true,
      requireTshirt: cfg?.requireTshirt !== undefined ? cfg.requireTshirt : true,
      enableChurchField: cfg?.enableChurchField !== undefined ? cfg.enableChurchField : true,
      requireChurchField: cfg?.requireChurchField !== undefined ? cfg.requireChurchField : true,
      churchLabel: cfg?.churchLabel || "Église d'appartenance",
      enableContactField: cfg?.enableContactField !== undefined ? cfg.enableContactField : true,
      contactLabel: cfg?.contactLabel || "Numéro de contact (WhatsApp)",
      enableIllnessField: cfg?.enableIllnessField !== undefined ? cfg.enableIllnessField : true,
      requireIllnessField: cfg?.requireIllnessField !== undefined ? cfg.requireIllnessField : true,
      illnessLabel: cfg?.illnessLabel || "Antécédents médicaux / Allergies",
      illnessHelpText: cfg?.illnessHelpText || "Précisez si vous suivez un traitement ou avez une allergie alimentaire/médicamenteuse.",
    };
  };

  const [config, setConfig] = useState<FormConfig>(() => getCleanConfig(initialConfig));
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(getCleanConfig(initialConfig)));

  // View modes
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeSubTab, setActiveSubTab] = useState<
    'theme' | 'header' | 'districts' | 'clubs' | 'tshirt' | 'custom_fields' | 'standard_fields'
  >('theme');

  // Saving states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Template Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Upload States
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // District state
  const [newDistrictInput, setNewDistrictInput] = useState('');
  const [editingDistrictIndex, setEditingDistrictIndex] = useState<number | null>(null);
  const [editingDistrictValue, setEditingDistrictValue] = useState('');

  // Club state
  const [editingClubIndex, setEditingClubIndex] = useState<number | null>(null);
  const [newClubLabel, setNewClubLabel] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [clubModalData, setClubModalData] = useState<{ id: string; label: string; desc: string; index?: number }>({
    id: '',
    label: '',
    desc: '',
  });

  // T-shirt size state
  const [newSizeInput, setNewSizeInput] = useState('');

  // Custom field modal state
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fieldModalData, setFieldModalData] = useState<FormCustomField>({
    id: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    helpText: '',
    options: [],
  });
  const [fieldOptionInput, setFieldOptionInput] = useState('');

  const isDirty = JSON.stringify(config) !== savedSnapshot;

  // Save changes to backend
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/form-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      }
      setSavedSnapshot(JSON.stringify(config));
      setSaveSuccessMsg('Modifications enregistrées et publiées en direct ! Le formulaire public est à jour.');
      if (onConfigSaved) {
        onConfigSaved(data.config || config);
      }
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      setSaveError(err.message || 'Impossible de sauvegarder la configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  // Upload image handler
  const handleUploadImage = async (file: File, target: 'banner' | 'logo') => {
    const isBanner = target === 'banner';
    if (isBanner) setIsUploadingBanner(true);
    else setIsUploadingLogo(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/upload-banner', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'image.");
      }

      setConfig((prev) => ({
        ...prev,
        header: {
          ...(prev.header || { showBanner: true }),
          [isBanner ? 'bannerUrl' : 'logoUrl']: data.url,
        },
      }));
      setSaveSuccessMsg(
        isBanner ? 'Bannière téléversée avec succès !' : 'Logo téléversé avec succès !'
      );
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || "Échec de l'upload de l'image.");
    } finally {
      if (isBanner) setIsUploadingBanner(false);
      else setIsUploadingLogo(false);
    }
  };

  // Template loader
  const handleApplyTemplate = (tpl: any) => {
    if (
      isDirty &&
      !confirm('Appliquer ce modèle remplacera vos modifications non enregistrées. Continuer ?')
    ) {
      return;
    }
    const clean = getCleanConfig(tpl);
    setConfig(clean);
    setShowTemplateModal(false);
    setSaveSuccessMsg(`Modèle « ${tpl.formTitle} » chargé dans l'éditeur. N'oubliez pas d'enregistrer.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Revert changes
  const handleRevert = () => {
    if (confirm('Voulez-vous annuler toutes les modifications locales non enregistrées ?')) {
      setConfig(JSON.parse(savedSnapshot));
      setSaveSuccessMsg('Modifications locales annulées.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Add a district
  const handleAddDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDistrictInput.trim();
    if (!trimmed) return;
    if (config.districts.includes(trimmed)) {
      alert('Ce district existe déjà dans la liste.');
      return;
    }
    let updated: string[];
    if (config.districts.includes('Autre')) {
      const filtered = config.districts.filter((d) => d !== 'Autre');
      updated = [...filtered, trimmed, 'Autre'];
    } else {
      updated = [...config.districts, trimmed];
    }
    setConfig((prev) => ({ ...prev, districts: updated }));
    setNewDistrictInput('');
  };

  const handleSaveEditingDistrict = (index: number) => {
    const trimmed = editingDistrictValue.trim();
    if (!trimmed) return;
    const updated = [...config.districts];
    updated[index] = trimmed;
    setConfig((prev) => ({ ...prev, districts: updated }));
    setEditingDistrictIndex(null);
    setEditingDistrictValue('');
  };

  const handleMoveDistrict = (index: number, direction: 'up' | 'down') => {
    const updated = [...config.districts];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setConfig((prev) => ({ ...prev, districts: updated }));
  };

  const handleRemoveDistrict = (index: number) => {
    const updated = config.districts.filter((_, i) => i !== index);
    setConfig((prev) => ({ ...prev, districts: updated }));
  };

  // Reset districts to official 13
  const handleResetDistricts = () => {
    if (confirm('Voulez-vous réinitialiser la liste aux 13 districts officiels ?')) {
      setConfig((prev) => ({
        ...prev,
        districts: [...DEFAULT_OFFICIAL_DISTRICTS],
      }));
    }
  };

  // Club modal handlers
  const handleOpenClubModal = (club?: FormClubOption, index?: number) => {
    if (club && index !== undefined) {
      setClubModalData({ id: club.id, label: club.label, desc: club.desc || '', index });
    } else {
      setClubModalData({ id: '', label: '', desc: '' });
    }
    setShowClubModal(true);
  };

  const handleSaveClubModal = () => {
    const trimmedLabel = clubModalData.label.trim();
    if (!trimmedLabel) {
      alert('Le nom du club est obligatoire.');
      return;
    }
    const safeId = clubModalData.id.trim() || trimmedLabel.replace(/\s+/g, '_');
    const newClub: FormClubOption = {
      id: safeId,
      label: trimmedLabel,
      desc: clubModalData.desc.trim() || 'Membre actif',
    };

    let updatedClubs = [...config.clubs];
    if (clubModalData.index !== undefined) {
      updatedClubs[clubModalData.index] = newClub;
    } else {
      if (updatedClubs.some((c) => c.id === 'Autre')) {
        const withoutAutre = updatedClubs.filter((c) => c.id !== 'Autre');
        const autre = updatedClubs.find((c) => c.id === 'Autre')!;
        updatedClubs = [...withoutAutre, newClub, autre];
      } else {
        updatedClubs.push(newClub);
      }
    }
    setConfig((prev) => ({ ...prev, clubs: updatedClubs }));
    setShowClubModal(false);
  };

  const handleMoveClub = (index: number, direction: 'up' | 'down') => {
    const updated = [...config.clubs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setConfig((prev) => ({ ...prev, clubs: updated }));
  };

  const handleRemoveClub = (index: number) => {
    const updated = config.clubs.filter((_, i) => i !== index);
    setConfig((prev) => ({ ...prev, clubs: updated }));
  };

  // Tshirt size handlers
  const handleAddSize = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (config.tshirtSizes.includes(trimmed)) {
      alert('Cette taille existe déjà.');
      return;
    }
    let updated: string[];
    if (config.tshirtSizes.includes('Autre')) {
      const withoutAutre = config.tshirtSizes.filter((s) => s !== 'Autre');
      updated = [...withoutAutre, trimmed, 'Autre'];
    } else {
      updated = [...config.tshirtSizes, trimmed];
    }
    setConfig((prev) => ({ ...prev, tshirtSizes: updated }));
    setNewSizeInput('');
  };

  const handleRemoveSize = (index: number) => {
    const updated = config.tshirtSizes.filter((_, i) => i !== index);
    setConfig((prev) => ({ ...prev, tshirtSizes: updated }));
  };

  // Custom Fields Handlers
  const handleOpenFieldModal = (field?: FormCustomField) => {
    if (field) {
      setFieldModalData({ ...field, options: field.options ? [...field.options] : [] });
    } else {
      setFieldModalData({
        id: `field_${Date.now()}`,
        label: '',
        type: 'text',
        required: false,
        placeholder: '',
        helpText: '',
        options: [],
      });
    }
    setFieldOptionInput('');
    setShowFieldModal(true);
  };

  const handleSaveFieldModal = () => {
    if (!fieldModalData.label.trim()) {
      alert('Veuillez renseigner le libellé du champ.');
      return;
    }
    const safeId = fieldModalData.id || `field_${Date.now()}`;
    const cleanField: FormCustomField = {
      ...fieldModalData,
      id: safeId,
      label: fieldModalData.label.trim(),
    };

    const existingIndex = (config.customFields || []).findIndex((f) => f.id === cleanField.id);
    let updatedList = [...(config.customFields || [])];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = cleanField;
    } else {
      updatedList.push(cleanField);
    }
    setConfig((prev) => ({ ...prev, customFields: updatedList }));
    setShowFieldModal(false);
  };

  const handleRemoveCustomField = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.id !== id),
    }));
  };

  const handleMoveCustomField = (index: number, direction: 'up' | 'down') => {
    const list = [...(config.customFields || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setConfig((prev) => ({ ...prev, customFields: list }));
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* CMS Top Action Bar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Studio CMS & Générateur de Formulaire Dynamique
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif italic font-bold text-stone-900">
            Gestionnaire Visuel & Personnalisation Complète
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Configurez vos champs, couleurs, bannières et testez en direct avant de publier.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Template Button */}
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all cursor-pointer shadow-2xs"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-amber-700" />
            <span>Modèles prédéfinis</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Éditeur seul"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer hidden md:flex ${
                viewMode === 'split'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Vue scindée (Éditeur + Aperçu côte à côte)"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Aperçu en direct plein écran"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>

          {/* Device Switcher (when preview is visible) */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400'
                }`}
                title="Aperçu Desktop"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-400'
                }`}
                title="Aperçu Mobile (iPhone)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Revert if dirty */}
          {isDirty && (
            <button
              type="button"
              onClick={handleRevert}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 border border-stone-200 cursor-pointer"
              title="Annuler les modifications non enregistrées"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              <span className="hidden sm:inline">Annuler</span>
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 ${
              isDirty ? 'bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-300 animate-pulse' : 'bg-stone-900 hover:bg-stone-800'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : isDirty ? 'Publier en Direct ⚡' : 'Enregistré'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div
        className={`grid gap-6 ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
        }`}
      >
        {/* LEFT COLUMN: EDITING TOOLS & TABS */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className={`space-y-6 ${
              viewMode === 'split' ? 'lg:col-span-6 xl:col-span-5' : 'w-full max-w-4xl mx-auto'
            }`}
          >
            {/* Horizontal Sub-Tabs Bar */}
            <div className="bg-white rounded-2xl border border-stone-200 p-1.5 shadow-2xs flex overflow-x-auto gap-1">
              {[
                { id: 'theme', label: 'Thème & Couleurs', icon: Palette },
                { id: 'header', label: 'Bannière & Titres', icon: ImageIcon },
                { id: 'districts', label: 'Districts', count: config.districts.length, icon: Compass },
                { id: 'clubs', label: 'Clubs', count: config.clubs.length, icon: Users },
                { id: 'tshirt', label: 'T-Shirts', count: config.tshirtSizes.length, icon: Shirt },
                { id: 'standard_fields', label: 'Champs de Base', icon: Church },
                { id: 'custom_fields', label: 'Champs Libres', count: (config.customFields || []).length, icon: Sparkles },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB 1: THEME & COULEURS */}
            {activeSubTab === 'theme' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-600" />
                    <span>Palette de Couleurs & Esthétique</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Modifiez l'apparence visuelle pour adapter le formulaire à votre identité d'événement.
                  </p>
                </div>

                {/* Presets Grid */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Palettes Recommandées (1 Clic)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {THEME_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), ...preset.theme },
                          }))
                        }
                        className="p-3 rounded-2xl border border-stone-200 hover:border-stone-400 text-left transition-all hover:shadow-xs cursor-pointer group bg-stone-50/50"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.theme.primaryColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.theme.accentColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: preset.theme.backgroundColor }}
                          />
                        </div>
                        <div className="text-xs font-bold text-stone-800 group-hover:text-stone-900">
                          {preset.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Couleur Primaire (Titres, En-têtes)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.theme?.primaryColor || '#5A5A40'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), primaryColor: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={config.theme?.primaryColor || '#5A5A40'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), primaryColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl uppercase"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Couleur d'Accent (Boutons, Actions)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.theme?.accentColor || '#D2691E'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), accentColor: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={config.theme?.accentColor || '#D2691E'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), accentColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl uppercase"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Arrière-plan de la Page
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.theme?.backgroundColor || '#f5f2ed'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), backgroundColor: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={config.theme?.backgroundColor || '#f5f2ed'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), backgroundColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl uppercase"
                      />
                    </div>
                  </div>

                  {/* Card Background Color */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Fond de la Carte Formulaire
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.theme?.cardBackgroundColor || '#ffffff'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), cardBackgroundColor: e.target.value },
                          }))
                        }
                        className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                      />
                      <input
                        type="text"
                        value={config.theme?.cardBackgroundColor || '#ffffff'}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), cardBackgroundColor: e.target.value },
                          }))
                        }
                        className="flex-1 px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Border Radius */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-xs font-semibold text-stone-700 mb-2">
                    Style des Coins & Bordures
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'rounded-none', label: 'Droit (0px)' },
                      { id: 'rounded-xl', label: 'Léger (12px)' },
                      { id: 'rounded-2xl', label: 'Doux (16px)' },
                      { id: 'rounded-3xl', label: 'Arrondi (24px)' },
                    ].map((radius) => (
                      <button
                        key={radius.id}
                        type="button"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            theme: { ...(prev.theme || {}), borderRadius: radius.id },
                          }))
                        }
                        className={`p-2.5 text-xs font-semibold border transition-all cursor-pointer ${
                          config.theme?.borderRadius === radius.id
                            ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        } ${radius.id}`}
                      >
                        {radius.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BANNIERE & EN-TETE */}
            {activeSubTab === 'header' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Image d'En-tête & Textes Principaux</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Téléversez une bannière ou choisissez dans la galerie haute résolution.
                  </p>
                </div>

                {/* Toggle Banner Switch */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <div className="text-xs font-bold text-stone-900">Afficher la Bannière Image</div>
                    <div className="text-[11px] text-stone-500">
                      Ajoute une couverture visuelle élégante au-dessus du formulaire.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.header?.showBanner !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          header: { ...(prev.header || {}), showBanner: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {config.header?.showBanner !== false && (
                  <>
                    {/* Banner Image Preview & Upload */}
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-stone-700">
                        Image de Bannière Actuelle
                      </label>
                      <div className="relative h-36 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
                        {config.header?.bannerUrl ? (
                          <img
                            src={config.header.bannerUrl}
                            alt="Aperçu Bannière"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-stone-400">
                            Aucune image sélectionnée
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-2">
                          <input
                            type="file"
                            ref={bannerFileInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUploadImage(file, 'banner');
                            }}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => bannerFileInputRef.current?.click()}
                            disabled={isUploadingBanner}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-stone-900 shadow-md hover:bg-stone-50 cursor-pointer disabled:opacity-50"
                          >
                            <UploadCloud className="w-3.5 h-3.5 inline mr-1.5 text-emerald-600" />
                            <span>{isUploadingBanner ? 'Téléversement...' : 'Importer depuis mon appareil'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Manual Banner URL Input */}
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Ou coller une URL d'image directe (HTTPS) :
                        </label>
                        <input
                          type="url"
                          value={config.header?.bannerUrl || ''}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              header: { ...(prev.header || {}), bannerUrl: e.target.value },
                            }))
                          }
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                        />
                      </div>

                      {/* Curated Unsplash Gallery */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                          Galerie de Bannières Thématiques HD
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {CURATED_BANNER_IMAGES.map((img) => (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() =>
                                setConfig((prev) => ({
                                  ...prev,
                                  header: { ...(prev.header || {}), bannerUrl: img.url },
                                }))
                              }
                              className="relative h-20 rounded-xl overflow-hidden border border-stone-200 hover:border-emerald-600 transition-all cursor-pointer group shadow-2xs"
                            >
                              <img
                                src={img.url}
                                alt={img.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-end p-1.5">
                                <span className="text-[10px] font-bold text-white leading-none truncate">
                                  {img.name}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Height & Opacity controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Hauteur de la Bannière
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'compact', label: 'Compacte' },
                              { id: 'medium', label: 'Standard' },
                              { id: 'tall', label: 'Haute' },
                            ].map((h) => (
                              <button
                                key={h.id}
                                type="button"
                                onClick={() =>
                                  setConfig((prev) => ({
                                    ...prev,
                                    header: { ...(prev.header || {}), bannerHeight: h.id as any },
                                  }))
                                }
                                className={`py-1.5 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                  config.header?.bannerHeight === h.id
                                    ? 'bg-stone-900 text-white border-stone-900'
                                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                                }`}
                              >
                                {h.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            Assombrissement du fond : {config.header?.bannerOverlayOpacity || 35}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            step="5"
                            value={config.header?.bannerOverlayOpacity ?? 35}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                header: {
                                  ...(prev.header || {}),
                                  bannerOverlayOpacity: parseInt(e.target.value),
                                },
                              }))
                            }
                            className="w-full accent-stone-900 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Logo Section */}
                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      <label className="block text-xs font-semibold text-stone-700">
                        Logo de l'Organisation / Événement
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadImage(file, 'logo');
                          }}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 cursor-pointer"
                        >
                          <UploadCloud className="w-3.5 h-3.5 inline mr-1" />
                          <span>{isUploadingLogo ? 'Envoi...' : 'Téléverser un logo'}</span>
                        </button>
                        <input
                          type="url"
                          value={config.header?.logoUrl || ''}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              header: { ...(prev.header || {}), logoUrl: e.target.value },
                            }))
                          }
                          placeholder="Ou URL directe du logo..."
                          className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl"
                        />
                        {config.header?.logoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                header: { ...(prev.header || {}), logoUrl: '' },
                              }))
                            }
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Form Titles */}
                <div className="space-y-4 pt-3 border-t border-stone-100">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Titre Principal du Formulaire
                    </label>
                    <input
                      type="text"
                      value={config.formTitle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, formTitle: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm font-bold border border-stone-300 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Sous-titre / Instructions
                    </label>
                    <input
                      type="text"
                      value={config.formSubtitle}
                      onChange={(e) => setConfig((prev) => ({ ...prev, formSubtitle: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Bannière d'Annonce / Alerte d'en-tête (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={config.bannerNotice}
                      onChange={(e) => setConfig((prev) => ({ ...prev, bannerNotice: e.target.value }))}
                      placeholder="Ex : Inscriptions limitées aux 300 premières places !"
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DISTRICTS CRUD */}
            {activeSubTab === 'districts' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-600" />
                      <span>Gestion des Districts & Zones</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Ajoutez, modifiez ou ordonnez les options du menu déroulant District.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDistricts}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl border border-stone-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Réinit. 13 Districts</span>
                  </button>
                </div>

                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <div className="text-xs font-bold text-stone-900">Activer le champ District</div>
                    <div className="text-[11px] text-stone-500">
                      Désactivez ce champ si votre formulaire ne nécessite pas de répartition par district.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableDistrictField !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, enableDistrictField: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Add new district */}
                <form onSubmit={handleAddDistrict} className="flex gap-2">
                  <input
                    type="text"
                    value={newDistrictInput}
                    onChange={(e) => setNewDistrictInput(e.target.value)}
                    placeholder="Nom du nouveau district (ex: District Abidjan-Nord)..."
                    className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </form>

                {/* Districts List */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {config.districts.map((district, index) => {
                    const isEditing = editingDistrictIndex === index;
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-white transition-all text-xs"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingDistrictValue}
                              onChange={(e) => setEditingDistrictValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-xs border border-emerald-400 rounded-lg bg-white"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditingDistrict(index)}
                              className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 font-medium text-stone-800 truncate flex-1">
                            <span className="w-5 text-[10px] text-stone-400 font-mono">
                              {index + 1}.
                            </span>
                            <span className="truncate">{district}</span>
                            {district === 'Autre' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                Dynamique
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveDistrict(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDistrict(index, 'down')}
                            disabled={index === config.districts.length - 1}
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingDistrictIndex(index);
                                setEditingDistrictValue(district);
                              }}
                              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                              title="Renommer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDistrict(index)}
                            className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: CLUBS & SECTIONS CRUD */}
            {activeSubTab === 'clubs' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Clubs JA, Sections & Catégories</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Personnalisez les badges de sélection pour les groupes de participants.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenClubModal()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouveau Club</span>
                  </button>
                </div>

                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <div className="text-xs font-bold text-stone-900">Activer le champ Club</div>
                    <div className="text-[11px] text-stone-500">
                      Permet aux participants de choisir leur groupe ou tranche d'âge.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableClubField !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, enableClubField: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Clubs List */}
                <div className="space-y-2">
                  {config.clubs.map((club, index) => (
                    <div
                      key={club.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-white transition-all text-xs"
                    >
                      <div className="flex-1 mr-2">
                        <div className="font-bold text-stone-900">{club.label}</div>
                        <div className="text-[11px] text-stone-500">{club.desc}</div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveClub(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                          title="Monter"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveClub(index, 'down')}
                          disabled={index === config.clubs.length - 1}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                          title="Descendre"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenClubModal(club, index)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveClub(index)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: T-SHIRTS CRUD */}
            {activeSubTab === 'tshirt' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-emerald-600" />
                    <span>Tailles de T-shirts Officiels</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Gérez la liste des tailles proposées lors de l'inscription.
                  </p>
                </div>

                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                  <div>
                    <div className="text-xs font-bold text-stone-900">Activer le champ Taille T-Shirt</div>
                    <div className="text-[11px] text-stone-500">
                      Si votre événement n'inclut pas de t-shirt, désactivez simplement cette section.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableTshirtField !== false}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, enableTshirtField: e.target.checked }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Add size input */}
                <form onSubmit={handleAddSize} className="flex gap-2">
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    placeholder="Nouvelle taille (ex: 3XL, 12 ans, Sur-mesure)..."
                    className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Ajouter
                  </button>
                </form>

                {/* Badges list */}
                <div className="flex flex-wrap gap-2.5">
                  {config.tshirtSizes.map((size, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-800 shadow-2xs"
                    >
                      <span>{size}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: CHAMPS DE BASE (ÉGLISE, CONTACT, SANTÉ) */}
            {activeSubTab === 'standard_fields' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <Church className="w-4 h-4 text-emerald-600" />
                    <span>Configuration des Champs Standards</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Activez, désactivez ou renommez les champs intégrés du registre.
                  </p>
                </div>

                {/* Église */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900">Champ Église / Organisation</div>
                      <div className="text-[11px] text-stone-500">Provenance ou paroisse du participant</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableChurchField !== false}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, enableChurchField: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  {config.enableChurchField !== false && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Libellé affiché sur le formulaire
                      </label>
                      <input
                        type="text"
                        value={config.churchLabel || "Église d'appartenance"}
                        onChange={(e) => setConfig((prev) => ({ ...prev, churchLabel: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900">Champ Téléphone / Contact</div>
                      <div className="text-[11px] text-stone-500">Coordonnées directes pour confirmation</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableContactField !== false}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, enableContactField: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  {config.enableContactField !== false && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Libellé du champ contact
                      </label>
                      <input
                        type="text"
                        value={config.contactLabel || "Numéro de contact (WhatsApp)"}
                        onChange={(e) => setConfig((prev) => ({ ...prev, contactLabel: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Santé & Allergies */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-stone-900">Section Antécédents Médicaux</div>
                      <div className="text-[11px] text-stone-500">Sécurité et assistance médicale d'urgence</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableIllnessField !== false}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, enableIllnessField: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  {config.enableIllnessField !== false && (
                    <div className="pt-2 space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Question posée
                        </label>
                        <input
                          type="text"
                          value={config.illnessLabel || "Antécédents médicaux / Allergies"}
                          onChange={(e) => setConfig((prev) => ({ ...prev, illnessLabel: e.target.value }))}
                          className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms Notice & Submit Button Label */}
                <div className="space-y-4 pt-3 border-t border-stone-100">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Décharge de responsabilité & Conditions d'inscription
                    </label>
                    <textarea
                      rows={2}
                      value={config.termsNotice || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, termsNotice: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Texte du Bouton de Soumission
                    </label>
                    <input
                      type="text"
                      value={config.submitButtonText || 'Continuer vers le Paiement'}
                      onChange={(e) => setConfig((prev) => ({ ...prev, submitButtonText: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: CHAMPS LIBRES & PERSONNALISÉS (CRÉER DE ZÉRO) */}
            {activeSubTab === 'custom_fields' && (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Champs Personnalisés Additionnels</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Créez n'importe quel type de champ pour adapter le formulaire à tout événement.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenFieldModal()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer un Champ</span>
                  </button>
                </div>

                {/* Fields list */}
                {(!config.customFields || config.customFields.length === 0) ? (
                  <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl space-y-2">
                    <Sparkles className="w-8 h-8 text-stone-300 mx-auto" />
                    <div className="text-xs font-bold text-stone-700">Aucun champ personnalisé créé</div>
                    <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                      Cliquez sur le bouton ci-dessus pour ajouter des questions supplémentaires (menu déroulant, case à cocher, texte libre, etc.).
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {config.customFields.map((cf, index) => (
                      <div
                        key={cf.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-white transition-all text-xs"
                      >
                        <div className="flex-1 mr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">{cf.label}</span>
                            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-mono">
                              {cf.type}
                            </span>
                            {cf.required && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                                Requis
                              </span>
                            )}
                          </div>
                          {cf.helpText && (
                            <div className="text-[11px] text-stone-500 mt-0.5">{cf.helpText}</div>
                          )}
                          {cf.options && cf.options.length > 0 && (
                            <div className="text-[10px] text-stone-400 mt-0.5 truncate">
                              Options : {cf.options.join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveCustomField(index, 'up')}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                            title="Monter"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCustomField(index, 'down')}
                            disabled={index === (config.customFields || []).length - 1}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-30"
                            title="Descendre"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenFieldModal(cf)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(cf.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`space-y-4 ${
              viewMode === 'split' ? 'lg:col-span-6 xl:col-span-7' : 'w-full max-w-4xl mx-auto'
            }`}
          >
            {/* Preview Banner info */}
            <div className="bg-stone-900 text-white rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">Aperçu Interactif en Temps Réel</span>
              </div>
              <span className="text-[11px] text-stone-400 hidden sm:inline">
                Les participants verront exactement ce rendu
              </span>
            </div>

            {/* The Live Interactive Preview Component */}
            <div className="bg-stone-100/70 p-2 sm:p-6 rounded-3xl border border-stone-200 overflow-y-auto max-h-[85vh]">
              <FormLivePreview config={config} device={previewDevice} />
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: TEMPLATE SELECTOR */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-stone-900">Modèles Clé-en-Main de Formulaire</h4>
                  <p className="text-xs text-stone-500">
                    Choisissez un point de départ ou repartez d'une feuille vierge.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {[
                {
                  id: 'banco',
                  title: 'Randonnée Banco 2026 (Officiel)',
                  desc: 'Thème nature forêt, 13 districts officiels, clubs JA, t-shirts, urgence médicale.',
                  color: 'border-emerald-300 bg-emerald-50/50',
                  tpl: TEMPLATE_BANCO_HIKE,
                },
                {
                  id: 'church',
                  title: "Convention & Séminaire d'Église",
                  desc: 'Thème bordeaux royal, départements ministériels, hébergement et repas.',
                  color: 'border-indigo-300 bg-indigo-50/50',
                  tpl: TEMPLATE_CHURCH_EVENT,
                },
                {
                  id: 'camp',
                  title: 'Grand Camp de Vacances & Scouts',
                  desc: 'Thème ciel & aventure, patrouilles, autorisation légale et compétences.',
                  color: 'border-amber-300 bg-amber-50/50',
                  tpl: TEMPLATE_YOUTH_CAMP,
                },
                {
                  id: 'blank',
                  title: 'Formulaire Vierge (De Zéro)',
                  desc: 'Base neutre et épurée sans districts ni clubs. Idéal pour tout concevoir sur-mesure.',
                  color: 'border-stone-300 bg-stone-50/80',
                  tpl: TEMPLATE_BLANK,
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleApplyTemplate(item.tpl)}
                  className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer ${item.color}`}
                >
                  <div className="text-xs font-bold text-stone-900 mb-1">{item.title}</div>
                  <p className="text-[11px] text-stone-600 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLUB EDITOR */}
      {showClubModal && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900">
                {clubModalData.index !== undefined ? 'Modifier le Club' : 'Ajouter un Nouveau Club'}
              </h4>
              <button
                type="button"
                onClick={() => setShowClubModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Nom du Club / Catégorie <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clubModalData.label}
                  onChange={(e) => setClubModalData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex : Aventurier, Éclaireur, Chef Guide..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description courte / Tranche d'âge
                </label>
                <input
                  type="text"
                  value={clubModalData.desc}
                  onChange={(e) => setClubModalData((prev) => ({ ...prev, desc: e.target.value }))}
                  placeholder="Ex : 4 à 9 ans, Cadre, Leader..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowClubModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveClubModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CUSTOM FIELD BUILDER */}
      {showFieldModal && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900">
                Configurer le Champ Personnalisé
              </h4>
              <button
                type="button"
                onClick={() => setShowFieldModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Libellé de la question <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fieldModalData.label}
                  onChange={(e) => setFieldModalData((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex : Personne à contacter en cas d'urgence..."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Type de champ
                  </label>
                  <select
                    value={fieldModalData.type}
                    onChange={(e) =>
                      setFieldModalData((prev) => ({ ...prev, type: e.target.value as any }))
                    }
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                  >
                    <option value="text">Texte court</option>
                    <option value="email">Adresse Email</option>
                    <option value="tel">Numéro de téléphone</option>
                    <option value="number">Nombre / Chiffre</option>
                    <option value="select">Menu déroulant (Choix)</option>
                    <option value="radio">Boutons Radio (Choix unique)</option>
                    <option value="checkbox">Case à cocher (Oui/Non)</option>
                    <option value="textarea">Zone de texte multilignes</option>
                    <option value="date">Sélecteur de date</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 cursor-pointer bg-stone-50">
                    <input
                      type="checkbox"
                      checked={fieldModalData.required}
                      onChange={(e) =>
                        setFieldModalData((prev) => ({ ...prev, required: e.target.checked }))
                      }
                      className="accent-stone-900 rounded"
                    />
                    <span className="text-xs font-bold text-stone-800">Champ obligatoire</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Texte indicatif (Placeholder)
                </label>
                <input
                  type="text"
                  value={fieldModalData.placeholder || ''}
                  onChange={(e) =>
                    setFieldModalData((prev) => ({ ...prev, placeholder: e.target.value }))
                  }
                  placeholder="Ex : +225 01 02 03 04 05"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Message d'aide sous le champ (Optionnel)
                </label>
                <input
                  type="text"
                  value={fieldModalData.helpText || ''}
                  onChange={(e) =>
                    setFieldModalData((prev) => ({ ...prev, helpText: e.target.value }))
                  }
                  placeholder="Ex : Numéro joignable 24h/24 le jour de la marche"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl"
                />
              </div>

              {/* Options editor for select & radio */}
              {(fieldModalData.type === 'select' || fieldModalData.type === 'radio') && (
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                  <label className="block text-xs font-bold text-stone-700">
                    Options du menu (Liste des choix)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fieldOptionInput}
                      onChange={(e) => setFieldOptionInput(e.target.value)}
                      placeholder="Nouvelle option..."
                      className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-xl bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = fieldOptionInput.trim();
                        if (!trimmed) return;
                        setFieldModalData((prev) => ({
                          ...prev,
                          options: [...(prev.options || []), trimmed],
                        }));
                        setFieldOptionInput('');
                      }}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(fieldModalData.options || []).map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium"
                      >
                        <span>{opt}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFieldModalData((prev) => ({
                              ...prev,
                              options: prev.options?.filter((_, idx) => idx !== oIdx),
                            }))
                          }
                          className="text-stone-400 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowFieldModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveFieldModal}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 cursor-pointer shadow-xs"
              >
                Valider le champ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
