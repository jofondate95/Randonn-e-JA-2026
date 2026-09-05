import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Save,
  Shirt,
  Users,
  AlertCircle,
  MessageSquare,
  FileText,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { FormConfig, FormClubOption, DEFAULT_OFFICIAL_DISTRICTS } from '../types.js';

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
  const [config, setConfig] = useState<FormConfig>(() => {
    return {
      districts: initialConfig?.districts && initialConfig.districts.length > 0
        ? initialConfig.districts
        : DEFAULT_OFFICIAL_DISTRICTS,
      tshirtSizes: initialConfig?.tshirtSizes && initialConfig.tshirtSizes.length > 0
        ? initialConfig.tshirtSizes
        : ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Autre'],
      clubs: initialConfig?.clubs && initialConfig.clubs.length > 0
        ? initialConfig.clubs
        : [
            { id: 'Aventurier', label: 'Aventurier', desc: '4 à 9 ans' },
            { id: 'Eclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
            { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
            { id: 'Aine', label: 'Aîné', desc: '22 ans et +' },
            { id: 'Chef Guide', label: 'Chef Guide', desc: 'Cadre' },
            { id: 'Leader de Jeunesse', label: 'Leader de Jeunesse', desc: 'Leader' },
            { id: 'Autre', label: 'Autre', desc: 'Non précisé' },
          ],
      bannerNotice: initialConfig?.bannerNotice || '',
      formTitle: initialConfig?.formTitle || "Formulaire d'inscription",
      formSubtitle: initialConfig?.formSubtitle || "Veuillez renseigner vos informations personnelles pour réserver votre place.",
      termsNotice: initialConfig?.termsNotice || "Je certifie être apte physiquement à la marche en forêt et m'engage à respecter les consignes de sécurité.",
      churches: initialConfig?.churches || [],
    };
  });

  // State for adding a new district
  const [newDistrictInput, setNewDistrictInput] = useState('');
  const [editingDistrictIndex, setEditingDistrictIndex] = useState<number | null>(null);
  const [editingDistrictValue, setEditingDistrictValue] = useState('');

  // State for adding a new tshirt size
  const [newSizeInput, setNewSizeInput] = useState('');

  // State for adding a new club
  const [newClubLabel, setNewClubLabel] = useState('');
  const [newClubDesc, setNewClubDesc] = useState('');

  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add a district
  const handleAddDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newDistrictInput.trim();
    if (!trimmed) return;
    if (config.districts.includes(trimmed)) {
      alert("Ce district existe déjà dans la liste.");
      return;
    }
    // Insert before 'Autre' if 'Autre' is at the end
    let updated: string[];
    if (config.districts.includes('Autre')) {
      const filtered = config.districts.filter(d => d !== 'Autre');
      updated = [...filtered, trimmed, 'Autre'];
    } else {
      updated = [...config.districts, trimmed];
    }
    setConfig(prev => ({ ...prev, districts: updated }));
    setNewDistrictInput('');
  };

  // Remove district
  const handleRemoveDistrict = (index: number) => {
    const target = config.districts[index];
    if (target === 'Autre' && config.districts.length > 1) {
      if (!confirm("Attention : supprimer 'Autre' empêchera les participants d'indiquer un district personnalisé. Confirmer ?")) {
        return;
      }
    }
    const updated = config.districts.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, districts: updated }));
  };

  // Move district up or down
  const handleMoveDistrict = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= config.districts.length) return;
    const updated = [...config.districts];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setConfig(prev => ({ ...prev, districts: updated }));
  };

  // Start editing district
  const handleStartEditDistrict = (index: number) => {
    setEditingDistrictIndex(index);
    setEditingDistrictValue(config.districts[index]);
  };

  // Confirm editing district
  const handleConfirmEditDistrict = () => {
    if (editingDistrictIndex === null) return;
    const trimmed = editingDistrictValue.trim();
    if (!trimmed) return;
    const updated = [...config.districts];
    updated[editingDistrictIndex] = trimmed;
    setConfig(prev => ({ ...prev, districts: updated }));
    setEditingDistrictIndex(null);
    setEditingDistrictValue('');
  };

  // Reset to default 13 districts
  const handleResetDistricts = () => {
    if (confirm("Réinitialiser la liste aux 13 districts officiels par défaut ?")) {
      setConfig(prev => ({ ...prev, districts: [...DEFAULT_OFFICIAL_DISTRICTS] }));
    }
  };

  // T-Shirt sizes handlers
  const handleAddTshirtSize = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSizeInput.trim().toUpperCase();
    if (!trimmed) return;
    if (config.tshirtSizes.includes(trimmed)) {
      alert("Cette taille existe déjà.");
      return;
    }
    setConfig(prev => ({ ...prev, tshirtSizes: [...prev.tshirtSizes, trimmed] }));
    setNewSizeInput('');
  };

  const handleRemoveTshirtSize = (index: number) => {
    const updated = config.tshirtSizes.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, tshirtSizes: updated }));
  };

  // Clubs handlers
  const handleAddClub = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newClubLabel.trim();
    if (!label) return;
    const id = label.replace(/\s+/g, '_');
    const newClub: FormClubOption = {
      id,
      label,
      desc: newClubDesc.trim() || 'Membre',
    };
    setConfig(prev => ({ ...prev, clubs: [...prev.clubs, newClub] }));
    setNewClubLabel('');
    setNewClubDesc('');
  };

  const handleRemoveClub = (index: number) => {
    const updated = config.clubs.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, clubs: updated }));
  };

  // Save changes to backend
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveError(null);
    try {
      const res = await fetch('/api/admin/form-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ formConfig: config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde.');
      setSaveSuccessMsg("Formulaire mis à jour avec succès en temps réel !");
      if (onConfigSaved) onConfigSaved(config);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#5A5A40] to-[#3f3f2d] text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-[#D2691E]" />
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full text-white">
              CMS Formulaire en Temps Réel
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-serif italic text-white">
            Gestion du Formulaire d'Inscription
          </h3>
          <p className="text-xs text-stone-200 mt-1 max-w-xl">
            Modifiez les districts, les clubs, les tailles de tee-shirts et les messages d'accueil directement ici. Toutes les modifications agissent immédiatement sur le formulaire public sans devoir modifier le code source.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D2691E] hover:bg-[#b85b19] text-white font-bold text-xs shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* SECTION 1: DISTRICTS MANAGEMENT (CRUD) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#D2691E]" />
              <h4 className="text-sm font-bold text-stone-900">
                Liste des Districts ({config.districts.length})
              </h4>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Ces options apparaissent dans le menu déroulant "District" du formulaire d'inscription.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDistricts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer shrink-0"
            title="Rétablir les 13 districts officiels par défaut"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
            <span>Rétablir les 13 officiels</span>
          </button>
        </div>

        {/* Add district form */}
        <form onSubmit={handleAddDistrict} className="flex gap-2">
          <input
            type="text"
            placeholder="Ex : District du Phare, District 6..."
            value={newDistrictInput}
            onChange={(e) => setNewDistrictInput(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-200 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#5A5A40] hover:bg-[#484833] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter le district</span>
          </button>
        </form>

        {/* Districts interactive list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
          {config.districts.map((district, index) => {
            const isEditing = editingDistrictIndex === index;
            const isFirst = index === 0;
            const isLast = index === config.districts.length - 1;

            return (
              <div
                key={`${district}-${index}`}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-white hover:border-amber-300 transition-all text-xs"
              >
                {isEditing ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={editingDistrictValue}
                      onChange={(e) => setEditingDistrictValue(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-amber-400 rounded-lg text-xs font-medium focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleConfirmEditDistrict}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-stone-800 truncate" title={district}>
                      {district}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveDistrict(index, 'up')}
                    disabled={isFirst}
                    className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                    title="Monter"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDistrict(index, 'down')}
                    disabled={isLast}
                    className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                    title="Descendre"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEditDistrict(index)}
                    className="p-1 text-stone-500 hover:text-amber-700 cursor-pointer"
                    title="Modifier"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDistrict(index)}
                    className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: T-SHIRT SIZES MANAGEMENT */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-[#D2691E]" />
            <h4 className="text-sm font-bold text-stone-900">
              Tailles de Tee-Shirt Souvenir ({config.tshirtSizes.length})
            </h4>
          </div>
          <span className="text-xs text-stone-500">Boutons de sélection rapide</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {config.tshirtSizes.map((size, index) => (
            <div
              key={size}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-800"
            >
              <span>{size}</span>
              <button
                type="button"
                onClick={() => handleRemoveTshirtSize(index)}
                className="text-stone-400 hover:text-rose-600 ml-1 cursor-pointer"
                title="Supprimer cette taille"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddTshirtSize} className="flex gap-2 max-w-sm pt-1">
          <input
            type="text"
            placeholder="Ex : 3XL, 4XL, S-Junior..."
            value={newSizeInput}
            onChange={(e) => setNewSizeInput(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-200 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Ajouter la taille
          </button>
        </form>
      </div>

      {/* SECTION 3: CLUBS CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D2691E]" />
            <h4 className="text-sm font-bold text-stone-900">
              Clubs d'Appartenance ({config.clubs.length})
            </h4>
          </div>
          <span className="text-xs text-stone-500">Boutons pilules du formulaire</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {config.clubs.map((club, index) => (
            <div
              key={club.id}
              className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50/80 text-xs"
            >
              <div>
                <div className="font-bold text-stone-800">{club.label}</div>
                <div className="text-[11px] text-stone-500">{club.desc}</div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveClub(index)}
                className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                title="Supprimer ce club"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddClub} className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            placeholder="Nom du club (ex: Ambassadeur)"
            value={newClubLabel}
            onChange={(e) => setNewClubLabel(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-200 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Tranche d'âge / Description (ex: 16 à 21 ans)"
            value={newClubDesc}
            onChange={(e) => setNewClubDesc(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-200 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shrink-0"
          >
            Ajouter le club
          </button>
        </form>
      </div>

      {/* SECTION 4: LIVE ANNOUNCEMENT BANNER & FORM TEXTS */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
        <div className="pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#D2691E]" />
            <h4 className="text-sm font-bold text-stone-900">
              Bandeau d'Information & Textes du Formulaire
            </h4>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Diffusez un message urgent ou personnalisez le titre du formulaire en temps réel.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Bandeau d'Annonce en Temps Réel (Affiché tout en haut du formulaire)
            </label>
            <textarea
              rows={2}
              placeholder="Ex : Attention, les inscriptions seront définitivement closes le 10 Novembre. Prévoyez vos chaussures de marche adéquates !"
              value={config.bannerNotice || ''}
              onChange={(e) => setConfig({ ...config, bannerNotice: e.target.value })}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Laissez vide si vous ne souhaitez afficher aucun message d'alerte.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Titre Principal du Formulaire
              </label>
              <input
                type="text"
                value={config.formTitle || ''}
                onChange={(e) => setConfig({ ...config, formTitle: e.target.value })}
                placeholder="Formulaire d'inscription"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Sous-Titre du Formulaire
              </label>
              <input
                type="text"
                value={config.formSubtitle || ''}
                onChange={(e) => setConfig({ ...config, formSubtitle: e.target.value })}
                placeholder="Veuillez renseigner vos informations personnelles..."
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Conditions d'Aptitude / Mentions Légales (Au-dessus du bouton de soumission)
            </label>
            <textarea
              rows={2}
              value={config.termsNotice || ''}
              onChange={(e) => setConfig({ ...config, termsNotice: e.target.value })}
              placeholder="Je certifie être apte physiquement à la marche en forêt..."
              className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#484833] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : 'Enregistrer tout le formulaire'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
