import React from 'react';
import { MapPin, Utensils, Mountain, Building2, Music, ShoppingBag, Landmark, Coffee, Hotel, Sparkles, ImageOff } from 'lucide-react';

interface PlacePhotoPlaceholderProps {
  categoryName?: string;
  categorySlug?: string;
  placeName?: string;
  className?: string;
  size?: 'card' | 'banner' | 'thumb';
  showBadge?: boolean;
}

export const PlacePhotoPlaceholder: React.FC<PlacePhotoPlaceholderProps> = ({
  categoryName = 'Local',
  categorySlug = '',
  placeName = '',
  className = '',
  size = 'card',
  showBadge = true,
}) => {
  // Escolhe ícone contextual baseado na categoria
  const getCategoryIcon = () => {
    const slug = (categorySlug || categoryName).toLowerCase();
    if (slug.includes('gastro') || slug.includes('restaurante') || slug.includes('bar')) {
      return <Utensils className="w-8 h-8 text-[#DE1F2A]/70" />;
    }
    if (slug.includes('natureza') || slug.includes('ecoturismo') || slug.includes('trilha') || slug.includes('araripe')) {
      return <Mountain className="w-8 h-8 text-emerald-600/70" />;
    }
    if (slug.includes('cultura') || slug.includes('museu') || slug.includes('histor')) {
      return <Landmark className="w-8 h-8 text-amber-600/70" />;
    }
    if (slug.includes('show') || slug.includes('evento') || slug.includes('musica')) {
      return <Music className="w-8 h-8 text-indigo-600/70" />;
    }
    if (slug.includes('comercio') || slug.includes('loja') || slug.includes('artesanato')) {
      return <ShoppingBag className="w-8 h-8 text-rose-600/70" />;
    }
    if (slug.includes('cafe') || slug.includes('lanche')) {
      return <Coffee className="w-8 h-8 text-amber-700/70" />;
    }
    if (slug.includes('hospedagem') || slug.includes('hotel') || slug.includes('pousada')) {
      return <Hotel className="w-8 h-8 text-sky-600/70" />;
    }
    return <Building2 className="w-8 h-8 text-gray-500" />;
  };

  const isBanner = size === 'banner';
  const isThumb = size === 'thumb';

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 text-gray-400 select-none ${className}`}
      role="img"
      aria-label={`Sem foto cadastrada para ${placeName || categoryName}`}
    >
      {/* Padrão decorativo sutil de fundo */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-gray-200/80 flex items-center justify-center mb-2 transition-transform group-hover:scale-105">
          {getCategoryIcon()}
        </div>

        {!isThumb && (
          <>
            <span className="text-xs font-bold text-gray-700 tracking-tight line-clamp-1">
              {placeName || categoryName}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
              <ImageOff className="w-3 h-3 text-gray-400" />
              <span>Sem foto enviada</span>
            </div>
          </>
        )}

        {isBanner && (
          <p className="text-[11px] text-gray-500 max-w-xs mt-1.5 leading-relaxed">
            Foto pendente de envio ou revisão pela equipe do Kariri.app.
          </p>
        )}
      </div>

      {showBadge && !isThumb && (
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-gray-500 border border-gray-200/60 shadow-2xs">
          Kariri.app
        </span>
      )}
    </div>
  );
};
