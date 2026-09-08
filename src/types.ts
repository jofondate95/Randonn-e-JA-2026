export type ClubType =
  | 'Aventurier'
  | 'Éclaireur'
  | 'Ambassadeur'
  | 'Aîné'
  | 'Chef Guide'
  | 'Leader de Jeunesse'
  | 'Autre';

export type TshirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'Autre' | '';

export type RegistrationStep = 'form' | 'payment' | 'proof' | 'confirmation';

export type RegistrationStatus =
  | 'draft'
  | 'payment_clicked'
  | 'pending_verification'
  | 'confirmed'
  | 'rejected';

export interface RegistrationFormData {
  fullName: string;
  church: string;
  contact: string;
  district: string;
  districtOther?: string;
  club: ClubType | '';
  clubOther?: string;
  tshirtSize?: TshirtSize;
  tshirtSizeOther?: string;
  hasIllness: 'Oui' | 'Non' | '';
  illnessDetails?: string;
  customFields?: Record<string, any>;
}

export interface RegistrationRecord extends RegistrationFormData {
  id: string;
  sessionId: string;
  currentStep: RegistrationStep;
  paymentClicked: boolean;
  paymentClickedAt?: string | null;
  transactionPhone?: string;
  proofFile?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    dataUrl?: string;
  } | null;
  status: RegistrationStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormClubOption {
  id: string;
  label: string;
  desc: string;
}

export interface FormCustomField {
  id: string;
  label: string;
  type: 'text' | 'tel' | 'email' | 'number' | 'select' | 'radio' | 'textarea' | 'date' | 'checkbox';
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[]; // for select and radio
  defaultValue?: string;
}

export interface FormThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  cardBackgroundColor: string;
  textColor: string;
  borderRadius: 'rounded-none' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
}

export interface FormHeaderConfig {
  showBanner: boolean;
  bannerUrl: string;
  bannerHeight: 'compact' | 'medium' | 'tall';
  bannerOverlayOpacity: number; // 0 to 80%
  logoUrl?: string;
  logoPosition?: 'left' | 'center';
}

export const DEFAULT_OFFICIAL_DISTRICTS: string[] = [
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
];

export interface FormConfig {
  // Appearance & Header
  theme: FormThemeConfig;
  header: FormHeaderConfig;

  // Header Texts
  formTitle: string;
  formSubtitle: string;
  bannerNotice: string;
  termsNotice: string;
  submitButtonText?: string;

  // Districts Field
  enableDistrictField?: boolean;
  allowDistrictOther?: boolean;
  districts: string[];

  // Clubs Field
  enableClubField?: boolean;
  allowClubOther?: boolean;
  clubs: FormClubOption[];

  // T-Shirt Field
  enableTshirtField?: boolean;
  requireTshirt?: boolean;
  allowTshirtOther?: boolean;
  tshirtSizes: string[];

  // Church / Organisation Field
  enableChurchField?: boolean;
  requireChurchField?: boolean;
  churchLabel?: string;
  churches?: string[];

  // Contact Field
  enableContactField?: boolean;
  contactLabel?: string;

  // Medical / Illness Field
  enableIllnessField?: boolean;
  requireIllnessField?: boolean;
  illnessLabel?: string;
  illnessHelpText?: string;

  // Custom Fields (Add any field from scratch)
  customFields?: FormCustomField[];

  // Current Template Identifier
  templateId?: 'banco_hike' | 'church_event' | 'youth_camp' | 'blank' | 'custom';
}

export interface PaymentSettings {
  paymentAmount: string;
  waveLink: string;
  waveRecipientName?: string;
  waveNumber?: string;
  generalInstructions: string;
  eventDate: string;
  eventLocation: string;
  eventName: string;
  // Optional / permanent secondary payment number
  momoNumber?: string;
  momoRecipientName?: string;
  orangeMoneyLink?: string;
  mtnMoMoLink?: string;
  // Dynamic Form CMS Configuration
  formConfig?: FormConfig;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'superadmin' | 'admin';
  createdAt: string;
  lastLogin?: string;
}

export interface AdminQuotaInfo {
  currentCount: number;
  maxCount: number;
  canCreateAdmin: boolean;
}

export interface AutoSaveState {
  sessionId: string;
  formData: RegistrationFormData;
  step: RegistrationStep;
  lastSavedAt: string;
  registrationId?: string;
}
