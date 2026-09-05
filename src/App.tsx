import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header.js';
import { StepIndicator } from './components/StepIndicator.js';
import { RegistrationForm } from './components/RegistrationForm.js';
import { PaymentStep } from './components/PaymentStep.js';
import { ConfirmationView } from './components/ConfirmationView.js';
import { AdminLoginModal } from './components/AdminLoginModal.js';
import { AdminView } from './components/AdminView.js';
import { ShareModal } from './components/ShareModal.js';
import { Shield, Trees, Heart } from 'lucide-react';
import {
  RegistrationFormData,
  RegistrationRecord,
  PaymentSettings,
  RegistrationStep,
  AdminUser,
} from './types.js';

const STORAGE_SESSION_KEY = 'randonnee_2026_session_id';
const STORAGE_DRAFT_KEY = 'randonnee_2026_draft_data';

const DEFAULT_FORM_DATA: RegistrationFormData = {
  fullName: '',
  church: '',
  contact: '',
  district: '',
  districtOther: '',
  club: '',
  clubOther: '',
  tshirtSize: '',
  tshirtSizeOther: '',
  hasIllness: '',
  illnessDetails: '',
};

export const PERMANENT_OFFICIAL_WAVE_LINK = 'https://pay.wave.com/m/M_ci_ZfLyfzYgXEbI/c/ci/?amount=5050';

const STORAGE_ADMIN_TOKEN = 'randonnee_banco_admin_token_permanent';
const STORAGE_ADMIN_USER = 'randonnee_banco_admin_user_permanent';

import { DEFAULT_OFFICIAL_DISTRICTS } from './types.js';

const DEFAULT_SETTINGS: PaymentSettings = {
  momoNumber: '0769343626',
  momoRecipientName: 'Comité Randonnée Banco 2026',
  paymentAmount: '5 050 FCFA',
  waveLink: PERMANENT_OFFICIAL_WAVE_LINK,
  waveRecipientName: 'Comité Randonnée Banco 2026',
  waveNumber: '+225 0769343626',
  orangeMoneyLink: '',
  mtnMoMoLink: '',
  generalInstructions:
    'Veuillez effectuer votre paiement exclusivement par Wave via le lien direct sécurisé ci-dessous. Conservez la capture d’écran de confirmation du transfert pour la soumettre.',
  eventDate: 'Dimanche 15 Novembre 2026',
  eventLocation: 'Forêt du Banco, Abidjan',
  eventName: 'Randonnée 2026',
  formConfig: {
    districts: DEFAULT_OFFICIAL_DISTRICTS,
    tshirtSizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Autre'],
    clubs: [
      { id: 'Aventurier', label: 'Aventurier', desc: '4 à 9 ans' },
      { id: 'Eclaireur', label: 'Éclaireur', desc: '10 à 15 ans' },
      { id: 'Ambassadeur', label: 'Ambassadeur', desc: '16 à 21 ans' },
      { id: 'Aine', label: 'Aîné', desc: '22 ans et +' },
      { id: 'Chef Guide', label: 'Chef Guide', desc: 'Cadre' },
      { id: 'Leader de Jeunesse', label: 'Leader de Jeunesse', desc: 'Leader' },
      { id: 'Autre', label: 'Autre', desc: 'Non précisé' },
    ],
    formTitle: "Formulaire d'inscription",
    formSubtitle: "Veuillez renseigner vos informations personnelles pour réserver votre place.",
  },
};

export default function App() {
  const [sessionId, setSessionId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [formData, setFormData] = useState<RegistrationFormData>(DEFAULT_FORM_DATA);
  const [registration, setRegistration] = useState<RegistrationRecord | null>(null);
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);

  // Auto-Save UI states
  const [lastSavedText, setLastSavedText] = useState<string>('Prêt pour la saisie');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Admin states
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Share / Simplified Link state
  const [showShareModal, setShowShareModal] = useState(false);

  // Track latest form data in ref for interval autosave
  const formDataRef = useRef(formData);
  const currentStepRef = useRef(currentStep);
  const registrationRef = useRef(registration);

  formDataRef.current = formData;
  currentStepRef.current = currentStep;
  registrationRef.current = registration;

  // Initialize Session ID & Load Settings & Restore Progress
  useEffect(() => {
    // Check URL for admin access or fresh form request
    const pathname = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const isAdminRequested = pathname === '/admin' || searchParams.get('admin') === 'true';

    if (searchParams.get('partager') === 'true' || searchParams.get('share') === 'true') {
      setShowShareModal(true);
    }

    // Restore persistent admin session if available (Permanent login)
    const savedAdminToken = localStorage.getItem(STORAGE_ADMIN_TOKEN);
    if (savedAdminToken) {
      fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${savedAdminToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Token expired or invalid');
        })
        .then((data) => {
          if (data && data.user) {
            setAdminToken(savedAdminToken);
            setAdminUser(data.user);
            if (isAdminRequested) {
              setShowAdminDashboard(true);
              setShowAdminLogin(false);
            }
          }
        })
        .catch(() => {
          // Token expired or invalid, remove stale keys
          localStorage.removeItem(STORAGE_ADMIN_TOKEN);
          localStorage.removeItem(STORAGE_ADMIN_USER);
          if (isAdminRequested) {
            setShowAdminLogin(true);
          }
        });
    } else if (isAdminRequested) {
      setShowAdminLogin(true);
    }

    let sid = localStorage.getItem(STORAGE_SESSION_KEY);
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_SESSION_KEY, sid);
    }
    setSessionId(sid);

    // Fetch public settings
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .catch((e) => console.error('Error loading settings', e));

    // Restore draft from local storage first (instant)
    const localDraft = localStorage.getItem(STORAGE_DRAFT_KEY);
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft);
        if (parsed.formData) {
          setFormData(parsed.formData);
        }
      } catch (e) {
        console.error('Error parsing local draft', e);
      }
    }

    // Restore progress from server
    fetch(`/api/registration/session/${sid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.registration) {
          setRegistration(data.registration);
          setFormData(data.registration);
          if (data.registration.status === 'confirmed' || data.registration.status === 'pending_verification') {
            setCurrentStep('confirmation');
          } else if (data.registration.currentStep) {
            setCurrentStep(data.registration.currentStep);
          }
          setLastSavedText(`Restauré depuis votre dernière visite`);
        } else if (data.draft) {
          if (data.draft.formData) {
            setFormData(data.draft.formData);
          }
          if (data.draft.step && data.draft.step !== 'form') {
            setCurrentStep(data.draft.step as RegistrationStep);
          }
          const date = new Date(data.draft.updatedAt);
          setLastSavedText(`Enregistré à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
        }
      })
      .catch((e) => console.error('Error fetching session state', e));
  }, []);

  // Server AutoSave implementation
  const triggerAutoSave = useCallback(
    async (dataToSave: RegistrationFormData) => {
      if (!sessionId) return;
      setIsSaving(true);
      try {
        // Save local
        localStorage.setItem(
          STORAGE_DRAFT_KEY,
          JSON.stringify({ formData: dataToSave, step: currentStepRef.current })
        );

        // Save server
        const res = await fetch('/api/registration/autosave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            formData: dataToSave,
            step: currentStepRef.current,
            registrationId: registrationRef.current?.id,
          }),
        });

        if (res.ok) {
          const now = new Date();
          setLastSavedText(`Enregistré à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
        }
      } catch (e) {
        console.warn('Autosave background warning:', e);
      } finally {
        setIsSaving(false);
      }
    },
    [sessionId]
  );

  // AutoSave every 2 minutes (120,000 ms) as mandated in prompt 1.3
  useEffect(() => {
    const interval = setInterval(() => {
      triggerAutoSave(formDataRef.current);
    }, 120 * 1000);

    return () => clearInterval(interval);
  }, [triggerAutoSave]);

  // Handle Step 1 Form Submission
  const handleFormSubmit = async (submittedFormData: RegistrationFormData) => {
    setGlobalError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/registration/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          formData: submittedFormData,
          registrationId: registration?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation du formulaire');
      }

      setRegistration(data.registration);
      setFormData(submittedFormData);
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setGlobalError(err.message);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track click on Payment link
  const handleTrackPaymentClick = async () => {
    if (!registration) return;
    try {
      const res = await fetch('/api/registration/track-payment-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: registration.id }),
      });
      const data = await res.json();
      if (data.registration) {
        setRegistration(data.registration);
      }
    } catch (e) {
      console.error('Error tracking payment click', e);
    }
  };

  // Upload Proof of payment and finalize registration
  const handleUploadProofAndSubmit = async (file: File, transactionPhone?: string): Promise<boolean> => {
    if (!registration) return false;
    setIsSubmitting(true);
    setGlobalError(null);

    const bodyFormData = new FormData();
    bodyFormData.append('proof', file);
    bodyFormData.append('registrationId', registration.id);
    if (transactionPhone) {
      bodyFormData.append('transactionPhone', transactionPhone);
    }

    try {
      const res = await fetch('/api/registration/upload-proof', {
        method: 'POST',
        body: bodyFormData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du téléversement de la preuve.');
      }

      setRegistration(data.registration);
      setCurrentStep('confirmation');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    } catch (err: any) {
      setGlobalError(err.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to create a new registration
  const handleNewRegistration = () => {
    const newSid = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(STORAGE_SESSION_KEY, newSid);
    localStorage.removeItem(STORAGE_DRAFT_KEY);
    setSessionId(newSid);
    setRegistration(null);
    setFormData(DEFAULT_FORM_DATA);
    setCurrentStep('form');
    setLastSavedText('Nouveau formulaire');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin login handler (Persisted permanently in localStorage)
  const handleAdminLoginSuccess = (token: string, user: AdminUser) => {
    localStorage.setItem(STORAGE_ADMIN_TOKEN, token);
    localStorage.setItem(STORAGE_ADMIN_USER, JSON.stringify(user));
    setAdminToken(token);
    setAdminUser(user);
    setShowAdminLogin(false);
    setShowAdminDashboard(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(STORAGE_ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_ADMIN_USER);
    setAdminToken(null);
    setAdminUser(null);
    setShowAdminDashboard(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-700 selection:text-white">
      {/* Visual Nature Banner & Header */}
      <Header onShareClick={() => setShowShareModal(true)} />

      {/* Global Error Banner if any */}
      {globalError && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4 w-full">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-800 font-semibold flex items-center justify-between gap-3 shadow-xs">
            <span>{globalError}</span>
            <button
              onClick={() => setGlobalError(null)}
              className="px-2 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar (Formulaire → Paiement → Confirmation) */}
      <StepIndicator
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
        canNavigateToPayment={!!registration}
      />

      {/* Main Multi-Step Content */}
      <main className="flex-1">
        {currentStep === 'form' && (
          <RegistrationForm
            initialData={formData}
            onSubmit={handleFormSubmit}
            onAutoSave={triggerAutoSave}
            lastSavedText={lastSavedText}
            isSaving={isSaving}
            onShareClick={() => setShowShareModal(true)}
            formConfig={settings.formConfig}
          />
        )}

        {(currentStep === 'payment' || currentStep === 'proof') && registration && (
          <PaymentStep
            settings={settings}
            registration={registration}
            onTrackPaymentClick={handleTrackPaymentClick}
            onUploadProofAndSubmit={handleUploadProofAndSubmit}
            onBackToForm={() => setCurrentStep('form')}
            isSubmitting={isSubmitting}
          />
        )}

        {currentStep === 'confirmation' && registration && (
          <ConfirmationView
            registration={registration}
            settings={settings}
            onNewRegistration={handleNewRegistration}
          />
        )}
      </main>

      {/* Discrete Footer with Shield Icon Access to Admin */}
      <footer className="bg-[#383827] text-[#c2c0b0] py-10 px-4 sm:px-6 border-t border-[#5A5A40]/30 text-xs mt-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-stone-300">
            <Trees className="w-4 h-4 text-[#D2691E]" />
            <span className="font-serif italic font-bold text-white text-sm">Randonnée 2026</span>
            <span className="text-[#5A5A40]">•</span>
            <span className="text-stone-300">Dimanche 15 Novembre 2026 — Forêt du Banco</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[#9e9b89] text-[11px] uppercase tracking-wider">
              Comité d'Organisation Officiel
            </span>

            {/* Discrete Shield Icon for Admin Access */}
            <button
              onClick={() => {
                if (adminToken && adminUser) {
                  setShowAdminDashboard(true);
                } else {
                  setShowAdminLogin(true);
                }
              }}
              className="p-2 rounded-full text-[#9e9b89] hover:text-[#D2691E] hover:bg-white/10 transition-all cursor-pointer"
              title="Espace d'administration"
              aria-label="Accès administration"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Share / Simplified Link Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        eventName={settings.eventName}
        eventDate={settings.eventDate}
      />

      {/* Admin Dashboard Full Modal */}
      {showAdminDashboard && adminToken && adminUser && (
        <AdminView
          token={adminToken}
          currentUser={adminUser}
          onLogout={handleAdminLogout}
          onClose={() => setShowAdminDashboard(false)}
          onSettingsUpdated={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}
