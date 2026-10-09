import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nenhum resultado encontrado',
  description = 'Tente ajustar seus termos de busca ou filtros para descobrir novos lugares.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4 shadow-inner">
        {icon || <Compass className="w-8 h-8 text-[#DE1F2A]" />}
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-xs mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#DE1F2A] text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-[#C51620] active:scale-95 transition"
        >
          <RotateCcw className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
