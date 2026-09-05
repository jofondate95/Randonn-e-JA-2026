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

export interface PaymentSettings {
  paymentAmount: string;
  waveLink: string;
  waveRecipientName?: string;
  waveNumber?: string;
  generalInstructions: string;
  eventDate: string;
  eventLocation: string;
  eventName: string;
  // Optional legacy fields for backward compatibility
  momoNumber?: string;
  momoRecipientName?: string;
  orangeMoneyLink?: string;
  mtnMoMoLink?: string;
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
