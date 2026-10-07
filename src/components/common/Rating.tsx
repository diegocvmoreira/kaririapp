import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  count,
  size = 'sm',
  showCount = true,
}) => {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  return (
    <div className="inline-flex items-center gap-1 font-medium">
      <Star className={`${iconSizes[size]} fill-amber-400 text-amber-400`} />
      <span className={`${textSizes[size]} text-gray-900 font-semibold`}>
        {value.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className={`${textSizes[size]} text-gray-500 font-normal`}>
          ({count})
        </span>
      )}
    </div>
  );
};
