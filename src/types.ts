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
  districts: string[];
  tshirtSizes: string[];
  clubs: FormClubOption[];
  churches?: string[];
  requireTshirt?: boolean;
  enableIllnessField?: boolean;
  bannerNotice?: string;
  formTitle?: string;
  formSubtitle?: string;
  termsNotice?: string;
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
