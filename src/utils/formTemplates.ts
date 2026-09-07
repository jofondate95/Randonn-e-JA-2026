import { FormConfig, FormThemeConfig, FormHeaderConfig } from '../types.js';

export interface ThemePreset {
  id: string;
  name: string;
  desc: string;
  theme: FormThemeConfig;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'banco_nature',
    name: '🌿 Nature & Forêt (Banco)',
    desc: 'Vert olive chaleureux, terracotta et fond écru naturel',
    theme: {
      primaryColor: '#5A5A40',
      accentColor: '#D2691E',
      backgroundColor: '#f5f2ed',
      cardBackgroundColor: '#ffffff',
      textColor: '#2d2d2a',
      borderRadius: 'rounded-3xl',
    },
  },
  {
    id: 'royal_emerald',
    name: '🌲 Émeraude & Vert Forêt',
    desc: 'Vert forêt profond, émeraude lumineuse et fond végétal très doux',
    theme: {
      primaryColor: '#064E3B',
      accentColor: '#10B981',
      backgroundColor: '#F0FDF4',
      cardBackgroundColor: '#ffffff',
      textColor: '#142a1f',
      borderRadius: 'rounded-2xl',
    },
  },
  {
    id: 'ocean_blue',
    name: '🌊 Bleu Océan & Ciel',
    desc: 'Bleu marine élégant, cyan éclatant et fond bleuté pur',
    theme: {
      primaryColor: '#1E3A8A',
      accentColor: '#0284C7',
      backgroundColor: '#F0F9FF',
      cardBackgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: 'rounded-2xl',
    },
  },
  {
    id: 'safari_terracotta',
    name: '🌅 Soleil & Terracotta',
    desc: 'Terre cuite ardente, ambre doré et fond beige solaire',
    theme: {
      primaryColor: '#7C2D12',
      accentColor: '#EA580C',
      backgroundColor: '#FFF7ED',
      cardBackgroundColor: '#ffffff',
      textColor: '#2c1810',
      borderRadius: 'rounded-3xl',
    },
  },
  {
    id: 'modern_slate',
    name: '🌌 Moderne Ardoise & Indigo',
    desc: 'Gris ardoise contemporain, indigo dynamique et fond sobre',
    theme: {
      primaryColor: '#334155',
      accentColor: '#6366F1',
      backgroundColor: '#F8FAFC',
      cardBackgroundColor: '#ffffff',
      textColor: '#0f172a',
      borderRadius: 'rounded-xl',
    },
  },
  {
    id: 'ruby_gold',
    name: '🍷 Bordeaux & Or Royal',
    desc: 'Bordeaux solennel, doré chaleureux et fond ivoire délicat',
    theme: {
      primaryColor: '#4C0519',
      accentColor: '#D97706',
      backgroundColor: '#FFFBEB',
      cardBackgroundColor: '#ffffff',
      textColor: '#26030c',
      borderRadius: 'rounded-2xl',
    },
  },
];

export interface BannerPreset {
  id: string;
  name: string;
  url: string;
  category: 'nature' | 'event' | 'conference' | 'youth' | 'minimal';
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'banco_canopy',
    name: 'Canopée Forêt du Banco',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
    category: 'nature',
  },
  {
    id: 'forest_trail',
    name: 'Sentier Nature Sous-Bois',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop',
    category: 'nature',
  },
  {
    id: 'mountain_hike',
    name: 'Randonnée & Panorama',
    url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1600&auto=format&fit=crop',
    category: 'nature',
  },
  {
    id: 'conference_hall',
    name: 'Conférence & Assemblée',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
    category: 'conference',
  },
  {
    id: 'youth_camp',
    name: 'Camp de Jeunesse & Aventure',
    url: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1600&auto=format&fit=crop',
    category: 'youth',
  },
  {
    id: 'community_church',
    name: 'Communauté & Partage',
    url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1600&auto=format&fit=crop',
    category: 'event',
  },
];

export const CURATED_BANNER_IMAGES = BANNER_PRESETS;


export const TEMPLATE_BANCO_HIKE: FormConfig = {
  templateId: 'banco_hike',
  theme: {
    primaryColor: '#5A5A40',
    accentColor: '#D2691E',
    backgroundColor: '#f5f2ed',
    cardBackgroundColor: '#ffffff',
    textColor: '#2d2d2a',
    borderRadius: 'rounded-3xl',
  },
  header: {
    showBanner: true,
    bannerUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop',
    bannerHeight: 'medium',
    bannerOverlayOpacity: 35,
    logoPosition: 'center',
  },
  formTitle: 'Inscription Officielle - Randonnée 2026',
  formSubtitle: 'Forêt du Banco • Dimanche 15 Novembre 2026',
  bannerNotice: 'Les inscriptions sont ouvertes jusqu’au 30 Octobre 2026. Réservez votre place dès maintenant.',
  termsNotice: 'En vous inscrivant, vous attestez être médicalement apte à participer à la randonnée en milieu naturel et vous vous engagez à respecter les consignes de sécurité.',
  submitButtonText: 'Continuer vers le Paiement (5 050 FCFA)',

  enableDistrictField: true,
  allowDistrictOther: true,
  districts: [
    'District du Phare',
    'District 2',
    'District 3',
    'District 4',
    'District 5',
    'District de la Me (Adzope)',
    'District d’Agboville',
    'District de Bonoua',
    'District de Songon',
    'District de Pole Maritime',
    'District d’Aboisso',
    'District d’Abengourou',
    'District KM 17',
    'Autre',
  ],

  enableClubField: true,
  allowClubOther: true,
  clubs: [
    { id: 'Aventurier', label: 'Aventurier', desc: '6 à 9 ans' },
    { id: 'Éclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
    { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
    { id: 'Aîné', label: 'Aîné', desc: 'Jeunes Adultes' },
    { id: 'Chef Guide', label: 'Chef Guide', desc: 'Cadres & Formateurs' },
    { id: 'Leader de Jeunesse', label: 'Leader de Jeunesse', desc: 'Responsables' },
    { id: 'Autre', label: 'Autre', desc: 'Sympathisant / Invité' },
  ],

  enableTshirtField: true,
  requireTshirt: true,
  allowTshirtOther: true,
  tshirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Sur-mesure', 'Autre'],

  enableChurchField: true,
  requireChurchField: true,
  churchLabel: 'Église locale ou Paroisse',
  churches: [
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
  ],

  enableContactField: true,
  contactLabel: 'Numéro de Téléphone (Contact / WhatsApp)',

  enableIllnessField: true,
  requireIllnessField: false,
  illnessLabel: 'Avez-vous des antécédents médicaux, allergies ou problème de santé ?',
  illnessHelpText: 'Précisez asthme, diabète, allergies, blessures récentes ou traitement particulier pour les secouristes.',

  customFields: [],
};

export const TEMPLATE_CHURCH_CONFERENCE: FormConfig = {

  templateId: 'church_event',
  theme: {
    primaryColor: '#1E3A8A',
    accentColor: '#0284C7',
    backgroundColor: '#F0F9FF',
    cardBackgroundColor: '#ffffff',
    textColor: '#0f172a',
    borderRadius: 'rounded-2xl',
  },
  header: {
    showBanner: true,
    bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600&auto=format&fit=crop',
    bannerHeight: 'medium',
    bannerOverlayOpacity: 40,
    logoPosition: 'center',
  },
  formTitle: 'Conférence & Séminaire Spirituel 2026',
  formSubtitle: 'Renouvellement, Formation & Fraternité • Palais de la Culture',
  bannerNotice: 'Places assises limitées dans l’amphithéâtre. Clôture des inscriptions dès quota atteint.',
  termsNotice: 'En vous inscrivant, vous confirmez votre présence et vous vous engagez à respecter le règlement intérieur de l’assemblée.',
  submitButtonText: 'Confirmer mon Enregistrement',

  enableDistrictField: false,
  allowDistrictOther: false,
  districts: [],

  enableClubField: false,
  allowClubOther: false,
  clubs: [],

  enableTshirtField: false,
  requireTshirt: false,
  allowTshirtOther: false,
  tshirtSizes: [],

  enableChurchField: true,
  requireChurchField: true,
  churchLabel: 'Église / Structure de provenance',
  churches: [
    'Temple du Jubilé (Cocody)',
    'Béthel (Yopougon)',
    'Maranatha (Treichville)',
    'Philadelphie (Abobo)',
    'Salem (Port-Bouët)',
  ],

  enableContactField: true,
  contactLabel: 'Numéro de Contact (WhatsApp obligatoire)',

  enableIllnessField: false,
  requireIllnessField: false,

  customFields: [
    {
      id: 'custom_role',
      label: 'Fonction ou Responsabilité',
      type: 'select',
      required: true,
      options: ['Pasteur / Responsable', 'Ancien / Diacre', 'Moniteur', 'Membre régulier', 'Visiteur'],
      helpText: 'Indiquez votre responsabilité pour l’attribution des badges nominatifs',
    },
    {
      id: 'custom_workshop',
      label: 'Atelier thématique de l’après-midi',
      type: 'select',
      required: true,
      options: [
        'Atelier A : Leadership chrétien & gouvernance',
        'Atelier B : Éducation des enfants et jeunesse',
        'Atelier C : Musique et louange d’assemblée',
        'Atelier D : Évangélisation digitale',
      ],
      helpText: 'Choisissez votre premier choix d’atelier',
    },
    {
      id: 'custom_meal',
      label: 'Option Déjeuner & Restauration sur place',
      type: 'radio',
      required: true,
      options: ['Oui, formule repas complète', 'Non, je prévois mon déjeuner'],
    },
  ],
};

export const TEMPLATE_CHURCH_EVENT = TEMPLATE_CHURCH_CONFERENCE;

export const TEMPLATE_YOUTH_CAMP: FormConfig = {
  templateId: 'youth_camp',
  theme: {
    primaryColor: '#064E3B',
    accentColor: '#10B981',
    backgroundColor: '#F0FDF4',
    cardBackgroundColor: '#ffffff',
    textColor: '#142a1f',
    borderRadius: 'rounded-2xl',
  },
  header: {
    showBanner: true,
    bannerUrl: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1600&auto=format&fit=crop',
    bannerHeight: 'tall',
    bannerOverlayOpacity: 30,
    logoPosition: 'center',
  },
  formTitle: 'Grand Camp de Vacances & Aventure Jeunesse',
  formSubtitle: '7 Jours en Pleine Nature • Activités, Camps & Foi',
  bannerNotice: 'Autorisation parentale obligatoire pour tous les participants mineurs.',
  termsNotice: 'Les parents certifient l’exactitude des informations médicales et autorisent le jeune à participer à l’ensemble des activités prévues.',
  submitButtonText: 'Valider le Dossier de Candidature',

  enableDistrictField: true,
  allowDistrictOther: true,
  districts: [
    'District du Phare',
    'District 2',
    'District 3',
    'District 4',
    'District 5',
    'District d’Agboville',
    'District de Bonoua',
    'District de Songon',
  ],

  enableClubField: true,
  allowClubOther: true,
  clubs: [
    { id: 'Aventurier', label: 'Aventurier', desc: '6 à 9 ans' },
    { id: 'Éclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
    { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
    { id: 'Cadre', label: 'Cadre / Moniteur', desc: 'Équipe d’encadrement' },
  ],

  enableTshirtField: true,
  requireTshirt: true,
  allowTshirtOther: false,
  tshirtSizes: ['Enfant 6-8 ans', 'Enfant 10-12 ans', 'S', 'M', 'L', 'XL'],

  enableChurchField: true,
  requireChurchField: true,
  churchLabel: 'Église / Club local d’appartenance',

  enableContactField: true,
  contactLabel: 'Numéro de téléphone du jeune (si disponible)',

  enableIllnessField: true,
  requireIllnessField: true,
  illnessLabel: 'Allergies alimentaires, intolérances ou soins médicaux continus',
  illnessHelpText: 'Information essentielle pour la commission médicale et les menus du camp.',

  customFields: [
    {
      id: 'custom_parent_name',
      label: 'Nom complet du Parent ou Tuteur légal',
      type: 'text',
      placeholder: 'Ex: KOUASSI Marc-Antoine',
      required: true,
      helpText: 'Responsable légal à contacter en priorité',
    },
    {
      id: 'custom_parent_phone',
      label: 'Numéro d’urgence du Parent (Téléphone direct)',
      type: 'tel',
      placeholder: '+225 07...',
      required: true,
    },
    {
      id: 'custom_swimmer',
      label: 'Aptitude à la baignade / Natation',
      type: 'select',
      required: true,
      options: ['Sait nager (attestation fournie)', 'Baignade sous surveillance uniquement', 'Ne sait pas nager'],
    },
  ],
};

export const TEMPLATE_BLANK: FormConfig = {
  templateId: 'blank',
  theme: {
    primaryColor: '#334155',
    accentColor: '#6366F1',
    backgroundColor: '#F8FAFC',
    cardBackgroundColor: '#ffffff',
    textColor: '#0f172a',
    borderRadius: 'rounded-2xl',
  },
  header: {
    showBanner: false,
    bannerUrl: '',
    bannerHeight: 'compact',
    bannerOverlayOpacity: 0,
    logoPosition: 'center',
  },
  formTitle: 'Nouveau Formulaire d’Inscription',
  formSubtitle: 'Veuillez renseigner vos informations pour valider votre enregistrement.',
  bannerNotice: '',
  termsNotice: 'En soumettant ce formulaire, vous attestez de l’exactitude des informations transmises.',
  submitButtonText: 'Soumettre mon Inscription',

  enableDistrictField: false,
  allowDistrictOther: false,
  districts: [],

  enableClubField: false,
  allowClubOther: false,
  clubs: [],

  enableTshirtField: false,
  requireTshirt: false,
  allowTshirtOther: false,
  tshirtSizes: [],

  enableChurchField: false,
  requireChurchField: false,
  churchLabel: 'Organisation / Église',
  churches: [],

  enableContactField: true,
  contactLabel: 'Numéro de Téléphone',

  enableIllnessField: false,
  requireIllnessField: false,

  customFields: [
    {
      id: 'custom_email',
      label: 'Adresse Email',
      type: 'email',
      placeholder: 'exemple@domaine.com',
      required: false,
      helpText: 'Pour recevoir la confirmation par courrier électronique',
    },
    {
      id: 'custom_city',
      label: 'Ville de résidence',
      type: 'text',
      placeholder: 'Ex: Abidjan, Bouaké, Yamoussoukro...',
      required: true,
    },
  ],
};

export const FORM_TEMPLATES = [
  {
    id: 'banco_hike',
    name: '🌿 Randonnée Forêt du Banco (Officiel)',
    description: 'Modèle complet avec 13 districts, clubs de jeunesse, tailles de tee-shirts et fiche médicale.',
    config: TEMPLATE_BANCO_HIKE,
  },
  {
    id: 'church_event',
    name: '⛪ Conférence & Séminaire Spirituel',
    description: 'Pour conventions, retraites d’églises, ateliers au choix et déjeuners.',
    config: TEMPLATE_CHURCH_CONFERENCE,
  },
  {
    id: 'youth_camp',
    name: '🏕️ Camp de Vacances & Jeunesse',
    description: 'Avec tuteur légal, contact d’urgence, antécédents médicaux obligatoires et contrôle baignade.',
    config: TEMPLATE_YOUTH_CAMP,
  },
  {
    id: 'blank',
    name: '📄 Formulaire Vierge (Partir de zéro)',
    description: 'Base épurée sans districts ni clubs imposés. Idéal pour concevoir votre propre formulaire sur-mesure.',
    config: TEMPLATE_BLANK,
  },
];
