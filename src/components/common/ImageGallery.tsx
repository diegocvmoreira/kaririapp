import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Star,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  UploadCloud,
} from 'lucide-react';
import { PlacePhotoPlaceholder } from './PlacePhotoPlaceholder';
import { useAuth } from '../../context/AuthContext';
import { prepareImageForUpload } from '../../utils/prepareImageForUpload';
import { uploadImage } from '../../services/api/uploads';

export interface GalleryPhotoItem {
  url: string;
  caption?: string;
  credit?: string;
  isCover?: boolean;
  type?: 'official' | 'community';
  date?: string;
}

interface ImageGalleryProps {
  images: (string | GalleryPhotoItem)[];
  placeName: string;
  categoryName?: string;
  categorySlug?: string;
  onAddCommunityPhoto?: (photo: GalleryPhotoItem) => Promise<void>;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  placeName,
  categoryName = 'Local',
  categorySlug = '',
  onAddCommunityPhoto,
}) => {
  const { user } = useAuth();

  // Normaliza lista de fotos suportando string simples ou objeto GalleryPhotoItem
  const normalizedPhotos: GalleryPhotoItem[] = (images || [])
    .filter(Boolean)
    .map((item, idx) => {
      if (typeof item === 'string') {
        return {
          url: item,
          caption: `${placeName} - foto ${idx + 1}`,
          credit: idx === 0 ? 'Foto oficial' : 'Colaboração da comunidade',
          isCover: idx === 0,
          type: idx === 0 ? 'official' : 'community',
        };
      }
      return item;
    });

  const [photosList, setPhotosList] = useState<GalleryPhotoItem[]>(normalizedPhotos);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());

  // Modal comunitário de envio de foto
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Swipe touch tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPhotosList(normalizedPhotos);
  }, [images]);

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : photosList.length - 1));
  }, [photosList.length]);

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev < photosList.length - 1 ? prev + 1 : 0));
  }, [photosList.length]);

  // Navegação por teclado e bloqueio do scroll do body
  useEffect(() => {
    if (!isLightboxOpen) return;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

  // Guarda o arquivo selecionado para envio real via FormData
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);

  const handleImageError = (index: number) => {
    setFailedIndices((prev) => new Set([...prev, index]));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadErrorMsg('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    setUploadErrorMsg(null);
    setSelectedImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setNewPhotoPreview(objectUrl);
  };

  const handleSendCommunityPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageFile) return;

    setIsUploading(true);
    setUploadErrorMsg(null);

    try {
      // 1. Otimiza a imagem no frontend (Web Worker, WebP, max 1.5MB)
      const optimizedFile = await prepareImageForUpload(selectedImageFile);

      // 2. Envia para a API via FormData para POST /api/uploads/images
      const uploaded = await uploadImage(optimizedFile);

      if (!uploaded?.url) {
        throw new Error('Servidor não retornou a URL da imagem enviada.');
      }

      const newPhoto: GalleryPhotoItem = {
        url: uploaded.url,
        caption: newPhotoCaption.trim() || `Foto enviada por ${user?.name || 'Visitante'}`,
        credit: user?.name ? `Foto por ${user.name}` : 'Colaborador do Kariri',
        isCover: false,
        type: 'community',
        date: new Date().toLocaleDateString('pt-BR'),
      };

      if (onAddCommunityPhoto) {
        await onAddCommunityPhoto(newPhoto);
      }
      setPhotosList((prev) => [...prev, newPhoto]);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setIsUploadModalOpen(false);
        setNewPhotoPreview(null);
        setSelectedImageFile(null);
        setNewPhotoCaption('');
      }, 2500);
    } catch (err: unknown) {
      console.error('Falha no upload comunitário:', err);
      setUploadErrorMsg(err instanceof Error ? err.message : 'Falha ao enviar foto para a moderação.');
    } finally {
      setIsUploading(false);
    }
  };

  if (photosList.length === 0) {
    return (
      <div className="space-y-3">
        <div className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden shadow-xs border border-gray-100 relative group">
          <PlacePhotoPlaceholder
            categoryName={categoryName}
            categorySlug={categorySlug}
            placeName={placeName}
            size="banner"
          />
          {/* Botão de contribuição comunitária quando sem fotos */}
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="absolute bottom-4 right-4 px-4 py-2 bg-white/95 hover:bg-white text-gray-900 rounded-2xl text-xs font-bold shadow-md border border-gray-200 transition flex items-center gap-1.5 active:scale-95"
          >
            <Camera className="w-4 h-4 text-[#DE1F2A]" />
            <span>Sugerir primeira foto</span>
          </button>
        </div>

        {/* Modal de envio comunitário */}
        {renderUploadModal()}
      </div>
    );
  }

  const currentPhoto = photosList[activeIdx] || photosList[0];
  const isCurrentFailed = failedIndices.has(activeIdx);

  function renderUploadModal() {
    if (!isUploadModalOpen) return null;
    return (
      <div
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-photo-title"
      >
        <div
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#DE1F2A]" />
              <h3 id="upload-photo-title" className="font-bold text-gray-900 text-sm sm:text-base">
                Enviar foto para {placeName}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {uploadSuccess ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">Foto enviada para moderação!</h4>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                Obrigado por colaborar com a comunidade do Cariri. A imagem será analisada e em breve aparecerá no guia.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendCommunityPhoto} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-gray-500">
                Você esteve aqui recentemente? Compartilhe um registro do prato, ambiente ou fachada.
              </p>

              {uploadErrorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{uploadErrorMsg}</span>
                </div>
              )}

              {newPhotoPreview ? (
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200">
                  <img src={newPhotoPreview} alt="Pré-visualização" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setNewPhotoPreview(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition"
                    title="Remover"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 hover:border-[#DE1F2A] rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-gray-50/60 hover:bg-[#FDE8E9]/15">
                  <UploadCloud className="w-7 h-7 text-gray-400 mb-1" />
                  <span className="font-bold text-gray-800 text-xs">
                    Clique para selecionar foto
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">JPG ou PNG até 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1 text-xs">
                  Legenda / O que mostra a foto? (opcional)
                </label>
                <input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="Ex: Almoço no domingo, área externa..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#DE1F2A]"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Fotos enviadas por visitantes passam por aprovação de segurança e direitos autorais antes da publicação.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPhotoPreview || isUploading}
                  className="px-5 py-2 rounded-xl bg-[#DE1F2A] hover:bg-[#C51620] text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading ? 'Enviando...' : 'Enviar para Moderação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Elemento oculto para anúncios acessíveis a leitores de tela */}
      <div className="sr-only" aria-live="polite">
        Foto {activeIdx + 1} de {photosList.length}: {currentPhoto.caption || placeName}
      </div>

      {/* Main Cover Banner */}
      <div
        className="relative w-full h-72 sm:h-96 rounded-3xl overflow-hidden cursor-pointer group shadow-sm bg-gray-900"
        onClick={() => setIsLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
        aria-label={`Abrir foto ${activeIdx + 1} em tela cheia`}
      >
        {!isCurrentFailed ? (
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || `${placeName} - foto principal`}
            onError={() => handleImageError(activeIdx)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PlacePhotoPlaceholder
            categoryName={categoryName}
            categorySlug={categorySlug}
            placeName={placeName}
            size="banner"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

        {/* Badges superiores: Capa e Autoria */}
        <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            {currentPhoto.isCover && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#DE1F2A] text-white shadow-xs flex items-center gap-1">
                <Star className="w-3 h-3 fill-white" />
                <span>Foto Principal</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/60 text-white backdrop-blur-md">
              {currentPhoto.type === 'official' ? 'Foto Oficial' : 'Foto da Comunidade'}
            </span>
          </div>

          <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full">
            {activeIdx + 1} / {photosList.length}
          </span>
        </div>

        {/* Legenda e Crédito na barra inferior da foto */}
        <div className="absolute bottom-3 inset-x-3.5 flex items-end justify-between z-10 text-white">
          <div className="max-w-[70%]">
            {currentPhoto.caption && (
              <p className="text-xs sm:text-sm font-bold text-white drop-shadow-sm line-clamp-1">
                {currentPhoto.caption}
              </p>
            )}
            {currentPhoto.credit && (
              <p className="text-[11px] text-gray-300 drop-shadow-xs truncate">
                {currentPhoto.credit}
              </p>
            )}
          </div>

          <span className="text-[11px] font-semibold text-white/80 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-xl group-hover:bg-white/30 transition">
            Ampliar galeria
          </span>
        </div>
      </div>

      {/* Thumbnails rail + Botão comunitário de adicionar foto */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {photosList.map((photo, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIdx(idx)}
            className={`relative w-20 h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition ${
              activeIdx === idx
                ? 'border-[#DE1F2A] scale-95 shadow-md ring-2 ring-[#DE1F2A]/30'
                : 'border-transparent opacity-75 hover:opacity-100'
            }`}
            aria-label={`Ver miniatura ${idx + 1}`}
          >
            {!failedIndices.has(idx) ? (
              <img
                src={photo.url}
                alt={`Miniatura ${idx + 1}`}
                onError={() => handleImageError(idx)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                Foto {idx + 1}
              </div>
            )}
            {photo.isCover && (
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#DE1F2A]" />
            )}
          </button>
        ))}

        {/* Botão de Enviar Foto da Comunidade */}
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="h-16 px-3.5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#DE1F2A] bg-white hover:bg-[#FDE8E9]/20 text-gray-600 hover:text-[#DE1F2A] flex flex-col items-center justify-center gap-1 shrink-0 transition active:scale-95"
          title="Adicionar foto para este local"
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] font-bold whitespace-nowrap">+ Foto</span>
        </button>
      </div>

      {/* Lightbox Modal com Gestos Touch (Swipe) e Navegação Acessível */}
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label={`Galeria de fotos de ${placeName}`}
        >
          {/* Barra Superior do Lightbox */}
          <div className="w-full max-w-4xl flex items-center justify-between text-white py-2 z-20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold truncate max-w-[200px] sm:max-w-none">
                {placeName}
              </span>
              <span className="text-xs text-white/60">
                ({activeIdx + 1} de {photosList.length})
              </span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition active:scale-95"
              aria-label="Fechar galeria"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Área Central da Imagem com Controles de Navegação */}
          <div
            className="relative max-w-4xl max-h-[75vh] w-full flex-1 flex items-center justify-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!isCurrentFailed ? (
              <img
                src={currentPhoto.url}
                alt={currentPhoto.caption || `${placeName} expandida`}
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl select-none"
              />
            ) : (
              <div className="w-full h-80 rounded-2xl overflow-hidden">
                <PlacePhotoPlaceholder
                  categoryName={categoryName}
                  categorySlug={categorySlug}
                  placeName={placeName}
                  size="banner"
                />
              </div>
            )}

            {photosList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition backdrop-blur-sm active:scale-90"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition backdrop-blur-sm active:scale-90"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Barra Inferior com Legenda, Crédito e Instrução de Teclado/Swipe */}
          <div className="w-full max-w-4xl text-center text-white/80 pb-2 z-20 space-y-1">
            {currentPhoto.caption && (
              <p className="text-xs sm:text-sm font-semibold text-white">
                {currentPhoto.caption}
              </p>
            )}
            <div className="flex items-center justify-center gap-3 text-[11px] text-white/60">
              {currentPhoto.credit && <span>{currentPhoto.credit}</span>}
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Use as setas ← → do teclado ou deslize para navegar</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envio comunitário */}
      {renderUploadModal()}
    </div>
  );
};
