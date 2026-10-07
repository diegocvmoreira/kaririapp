import React from 'react';

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onClick,
  count,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none ${
        isSelected
          ? 'bg-[#1F2024] text-white shadow-xs scale-102 ring-2 ring-gray-900/10'
          : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      } ${className}`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
            isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
