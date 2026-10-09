import React from 'react';
import { MapPin } from 'lucide-react';
import { formatDistance } from '../../utils/formatters';

interface LocationBadgeProps {
  cityName: string;
  neighborhood?: string;
  distanceKm?: number;
  className?: string;
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  cityName,
  neighborhood,
  distanceKm,
  className = '',
}) => {
  const distanceStr = formatDistance(distanceKm);

  return (
    <div className={`inline-flex items-center gap-1 text-xs text-gray-500 font-medium truncate ${className}`}>
      <MapPin className="w-3.5 h-3.5 text-[#DE1F2A] shrink-0" />
      <span className="truncate">
        {neighborhood ? `${neighborhood}, ` : ''}{cityName}
      </span>
      {distanceStr && (
        <span className="text-gray-400 font-normal shrink-0">
          • {distanceStr}
        </span>
      )}
    </div>
  );
};
