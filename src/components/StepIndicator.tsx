import React from 'react';
import { FileText, CreditCard, CheckCircle2 } from 'lucide-react';
import { RegistrationStep } from '../types.js';

interface StepIndicatorProps {
  currentStep: RegistrationStep;
  onStepClick?: (step: RegistrationStep) => void;
  canNavigateToPayment?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  canNavigateToPayment,
}) => {
  const steps = [
    {
      id: 'form',
      label: 'Formulaire',
      description: 'Coordonnées & Informations',
      icon: FileText,
      stepNumber: 1,
    },
    {
      id: 'payment',
      label: 'Paiement',
      description: 'Mobile Money & Preuve',
      icon: CreditCard,
      stepNumber: 2,
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      description: 'Statut & Récapitulatif',
      icon: CheckCircle2,
      stepNumber: 3,
    },
  ];

  const getStepStatus = (stepId: string) => {
    const order = ['form', 'payment', 'proof', 'confirmation'];
    const currentIndex = currentStep === 'proof' ? 1 : order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);

    if (currentStep === stepId || (currentStep === 'proof' && stepId === 'payment')) {
      return 'active';
    }
    if (currentIndex > stepIndex) {
      return 'completed';
    }
    return 'upcoming';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 my-6">
      <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-[#5A5A40]/15 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-[#5A5A40]/15 -z-0" />

          {steps.map((step) => {
            const status = getStepStatus(step.id);
            const Icon = step.icon;

            const isClickable =
              (step.id === 'form' && currentStep !== 'form') ||
              (step.id === 'payment' && canNavigateToPayment && currentStep === 'confirmation');

            return (
              <div
                key={step.id}
                onClick={() => isClickable && onStepClick && onStepClick(step.id as RegistrationStep)}
                className={`relative z-10 flex items-center gap-3 bg-white px-3 py-1 rounded-full select-none transition-all ${
                  isClickable ? 'cursor-pointer group' : ''
                }`}
              >
                {/* Step Circle */}
                <div
                  className={`w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                    status === 'active'
                      ? 'border-2 border-[#D2691E] bg-[#D2691E] text-white shadow-xs'
                      : status === 'completed'
                      ? 'border-2 border-[#5A5A40] bg-[#5A5A40] text-white'
                      : 'border-2 border-[#5A5A40]/30 bg-transparent text-[#5A5A40]/60'
                  }`}
                >
                  <span>{step.stepNumber}</span>
                </div>

                {/* Step Label */}
                <div className="hidden sm:block text-left">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7a7a72]">
                    Étape 0{step.stepNumber}
                  </div>
                  <div
                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider leading-tight ${
                      status === 'active'
                        ? 'text-[#D2691E]'
                        : status === 'completed'
                        ? 'text-[#5A5A40]'
                        : 'text-[#7a7a72]/70'
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
