import React from 'react';
import { formatPriceSymbols } from '../../utils/formatters';

interface PriceBadgeProps {
  level: 1 | 2 | 3 | 4;
  className?: string;
}

export const PriceBadge: React.FC<PriceBadgeProps> = ({ level, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 ${className}`}
      title={`Faixa de preço: nível ${level}`}
    >
      <span className="text-[#1F2024]">{formatPriceSymbols(level)}</span>
      <span className="text-gray-300">
        {'$'.repeat(Math.max(0, 4 - level))}
      </span>
    </span>
  );
};
