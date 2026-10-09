import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionTo?: string;
  onActionClick?: () => void;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  actionTo,
  onActionClick,
  className = '',
}) => {
  return (
    <div className={`flex items-end justify-between mb-3 px-4 ${className}`}>
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-[#000000] tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {actionText && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex items-center text-xs font-semibold text-[#DE1F2A] hover:text-[#C51620] transition-colors py-1 pl-2 group"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {actionText && !actionTo && onActionClick && (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center text-xs font-semibold text-[#DE1F2A] hover:text-[#C51620] transition-colors py-1 pl-2 group"
        >
          <span>{actionText}</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
};
