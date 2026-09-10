import React from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

export interface StepItem {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface StepWizardProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const StepWizard: React.FC<StepWizardProps> = ({
  steps = [],
  currentStepIndex,
  onStepClick,
  className,
  style,
}) => {
  return (
    <div className={className} style={{ width: '100%', padding: '16px 0', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Background Connecting Line */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            right: 24,
            height: 2,
            background: 'var(--border)',
            zIndex: 0,
          }}
        />

        {/* Progress Line */}
        <motion.div
          style={{
            position: 'absolute',
            top: 20,
            left: 24,
            height: 2,
            background: 'linear-gradient(to right, var(--accent), var(--accent-light, #818cf8), #22d3ee)',
            zIndex: 0,
          }}
          initial={{ width: '0%' }}
          animate={{
            width: `${(currentStepIndex / (steps.length - 1 || 1)) * 100}%`,
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          let circleBg = 'var(--bg-primary)';
          let circleBorder = 'var(--border)';
          let circleColor = 'var(--text-quaternary)';
          let circleShadow = 'none';

          if (isCompleted) {
            circleBg = 'var(--success)';
            circleBorder = 'var(--success)';
            circleColor = '#ffffff';
            circleShadow = '0 0 12px rgba(16, 185, 129, 0.4)';
          } else if (isCurrent) {
            circleBg = 'var(--accent)';
            circleBorder = 'var(--accent)';
            circleColor = '#ffffff';
            circleShadow = '0 0 16px var(--accent-glow), 0 0 0 4px var(--accent-muted)';
          }

          return (
            <div
              key={step.id}
              onClick={() => isCompleted && onStepClick && onStepClick(index)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                userSelect: 'none',
                cursor: isCompleted && onStepClick ? 'pointer' : 'default',
              }}
            >
              {/* Circle / Icon */}
              <motion.div
                whileHover={isCompleted ? { scale: 1.1 } : {}}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease',
                  border: `1px solid ${circleBorder}`,
                  background: circleBg,
                  color: circleColor,
                  boxShadow: circleShadow,
                }}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  index + 1
                )}
              </motion.div>

              {/* Title & Description */}
              <div style={{ marginTop: 10, textAlign: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'block',
                    color: isCurrent
                      ? 'var(--accent)'
                      : isCompleted
                      ? 'var(--text-primary)'
                      : 'var(--text-tertiary)',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-quaternary)',
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
