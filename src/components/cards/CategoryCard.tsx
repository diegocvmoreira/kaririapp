import React from 'react';
import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Landmark,
  Coffee,
  Trees,
  Beer,
  ShoppingBag,
  Hotel,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  variant?: 'pill' | 'tile' | 'card';
  isSelected?: boolean;
  onClick?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  UtensilsCrossed,
  Landmark,
  Coffee,
  Trees,
  Beer,
  ShoppingBag,
  Hotel,
  Compass,
  Sparkles,
  // Mapeamentos para ícones retornados da API Laravel
  restaurant: UtensilsCrossed,
  terrain: Trees,
  palette: Landmark,
  local_bar: Beer,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  variant = 'tile',
  isSelected = false,
  onClick,
}) => {
  const IconComponent = ICON_MAP[category.icon] || Sparkles;

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
          isSelected
            ? 'bg-[#DE1F2A] text-white shadow-sm scale-102 ring-2 ring-[#DE1F2A]/20'
            : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#DE1F2A]'}`} />
        <span>{category.name}</span>
        {category.count !== undefined && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {category.count}
          </span>
        )}
      </button>
    );
  }

  // Default 'tile' vertical format (Inspired by Travel Discovery apps)
  const content = (
    <div
      className={`group flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200 ${
        isSelected
          ? 'bg-[#DE1F2A] text-white shadow-md scale-105'
          : 'bg-white border border-gray-100 text-gray-800 shadow-xs hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110 ${
          isSelected ? 'bg-white/20 text-white' : 'bg-[#FDE8E9] text-[#DE1F2A]'
        }`}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      <span className="text-xs font-bold text-center line-clamp-1">
        {category.name}
      </span>
      {category.count !== undefined && (
        <span
          className={`text-[10px] mt-0.5 ${
            isSelected ? 'text-white/80' : 'text-gray-400'
          }`}
        >
          {category.count} locais
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left w-full focus:outline-none">
        {content}
      </button>
    );
  }

  return (
    <Link to={`/categorias/${category.slug}`} className="block focus:outline-none">
      {content}
    </Link>
  );
};
