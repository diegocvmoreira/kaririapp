import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  placeName: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, placeName }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-3xl flex items-center justify-center text-gray-400">
        Sem fotos disponíveis
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-3">
      {/* Main Cover Banner */}
      <div
        className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden cursor-pointer group shadow-sm bg-gray-100"
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={images[activeIdx] || images[0]}
          alt={`${placeName} - foto principal`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Counter Badge */}
        <span className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full">
          {activeIdx + 1} / {images.length}
        </span>
      </div>

      {/* Thumbnails rail */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                activeIdx === idx
                  ? 'border-[#D9262E] scale-95 shadow-sm'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img}
                alt={`${placeName} miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
            aria-label="Fechar galeria"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-4xl max-h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeIdx]}
              alt={`${placeName} expandida`}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition backdrop-blur-sm"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition backdrop-blur-sm"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <p className="text-white/60 text-xs mt-3">
            {activeIdx + 1} de {images.length} fotos
          </p>
        </div>
      )}
    </div>
  );
};
