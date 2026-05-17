import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface WizardStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  completedSteps: number[];
  highestStepReached?: number;
}

const WizardStepper: React.FC<WizardStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  completedSteps,
  highestStepReached,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isActive = currentStep === step.id;
            const isClickable = highestStepReached ? step.id <= highestStepReached : (isCompleted || isActive || step.id < currentStep);

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => isClickable && onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center gap-3 flex-1 transition-all',
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                  )}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center btn-primary text-sm transition-all shrink-0',
                      isCompleted &&
                        'bg-gradient-to-br from-[#C8102E] to-[#A90F14] text-white shadow-sm',
                      isActive &&
                        'bg-gradient-to-br from-[#C8102E] to-[#A90F14] text-white shadow-md ring-4 ring-red-50',
                      !isCompleted && !isActive && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                    )}
                  >
                    {isCompleted ? <Check className="h-4.5 w-4.5" strokeWidth={3} /> : step.id}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 text-left">
                    <h3
                      className={cn(
                        'text-sm btn-primary transition-colors leading-tight',
                        (isCompleted || isActive) && 'text-[#111827]',
                        !isCompleted && !isActive && 'text-[#9CA3AF]'
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        'text-xs transition-colors mt-0.5 leading-tight',
                        (isCompleted || isActive) && 'text-[#6B7280]',
                        !isCompleted && !isActive && 'text-[#D1D5DB]'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 min-w-[40px] h-[2px] mx-3">
                    <div
                      className={cn(
                        'h-full transition-all rounded-full',
                        (isCompleted || (currentStep > step.id)) && 'bg-gradient-to-r from-[#C8102E] to-[#A90F14]',
                        !(isCompleted || (currentStep > step.id)) && 'bg-gray-200'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
    </div>
  );
};

export { WizardStepper };
