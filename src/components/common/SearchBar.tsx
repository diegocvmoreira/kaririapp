import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  hasActiveFilters?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar restaurantes, eventos, pontos...',
  onFilterClick,
  hasActiveFilters = false,
  autoFocus = false,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#D9262E] focus:ring-2 focus:ring-[#D9262E]/10 transition shadow-xs"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          className={`relative p-2.5 rounded-2xl border transition shadow-xs flex items-center justify-center shrink-0 ${
            hasActiveFilters
              ? 'bg-[#D9262E] text-white border-[#D9262E]'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
          aria-label="Filtros de pesquisa"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full ring-2 ring-[#D9262E]" />
          )}
        </button>
      )}
    </div>
  );
};
