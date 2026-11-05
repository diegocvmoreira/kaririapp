import React from 'react';
import { Check, Circle } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
  showTitle?: boolean;
}

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export function evaluatePasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: 'Mínimo de 12 caracteres',
      met: password.length >= 12,
    },
    {
      id: 'uppercase',
      label: 'Letra maiúscula (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'Letra minúscula (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      id: 'number',
      label: 'Número (0-9)',
      met: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'Caractere especial (!@#$%...)',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  className = '',
  showTitle = true,
}) => {
  const requirements = evaluatePasswordRequirements(password);
  const totalMet = requirements.filter((r) => r.met).length;

  return (
    <div
      className={`p-3 bg-gray-50/90 rounded-xl border border-gray-200/80 space-y-2 text-xs ${className}`}
      aria-live="polite"
    >
      {showTitle && (
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
          <span>Requisitos da Senha:</span>
          <span
            className={
              totalMet === requirements.length
                ? 'text-emerald-600'
                : totalMet >= 3
                ? 'text-amber-600'
                : 'text-gray-400'
            }
          >
            {totalMet} de {requirements.length} atendidos
          </span>
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" role="list">
        {requirements.map((req) => (
          <li
            key={req.id}
            className={`flex items-center gap-1.5 transition-colors ${
              req.met ? 'text-emerald-700 font-semibold' : 'text-gray-500'
            }`}
          >
            {req.met ? (
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-gray-200/80 text-gray-400 flex items-center justify-center shrink-0">
                <Circle className="w-1.5 h-1.5 fill-current" />
              </span>
            )}
            <span className="text-[11px] leading-tight">{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
