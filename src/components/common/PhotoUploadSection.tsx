import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  X,
  Star,
  Link as LinkIcon,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { PlacePhotoPlaceholder } from './PlacePhotoPlaceholder';

interface PhotoUploadSectionProps {
  coverImage: string;
  onChangeCoverImage: (url: string) => void;
  galleryImages?: string[];
  onChangeGalleryImages?: (images: string[]) => void;
  categoryName?: string;
  categorySlug?: string;
  placeName?: string;
  maxFiles?: number;
  label?: string;
  description?: string;
}

export const PhotoUploadSection: React.FC<PhotoUploadSectionProps> = ({
  coverImage,
  onChangeCoverImage,
  galleryImages = [],
  onChangeGalleryImages,
  categoryName = 'Local',
  categorySlug = '',
  placeName = '',
  maxFiles = 9, // 1 capa + até 8 fotos adicionais
  label = 'Fotos do Local',
  description = 'Envie fotos reais do estabelecimento ou espaço para enriquecer o catálogo do Kariri.app.',
}) => {
  const [showUrlOption, setShowUrlOption] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Consolida lista de todas as fotos garantindo somente URLs válidas http/https (rejeita Base64 data: URLs)
  const allPhotos = Array.from(
    new Set(
      [coverImage, ...galleryImages].filter(
        (url): url is string => Boolean(url) && /^https?:\/\//i.test(url.trim())
      )
    )
  );

  const notifyLocalFileNotSupported = (e?: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg(
      'O upload direto de arquivos locais não é suportado pelo backend da API. Por favor, adicione as fotos através da opção "Adicionar foto por link (URL)" utilizando um link público acessível com https:// (ex: Imgur, Cloudinary, Instagram ou site oficial).'
    );
    setShowUrlOption(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();

    // Rejeição explícita de imagens Base64
    if (url.startsWith('data:')) {
      setErrorMsg('Imagens codificadas em Base64 não são aceitas pela API. Forneça uma URL pública iniciando com https://');
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      setErrorMsg('Informe uma URL de imagem válida iniciando com https://');
      return;
    }

    if (allPhotos.includes(url)) {
      setErrorMsg('Esta URL de imagem já foi adicionada.');
      return;
    }

    if (allPhotos.length >= maxFiles) {
      setErrorMsg(`Limite máximo de ${maxFiles} imagens atingido.`);
      return;
    }

    if (!coverImage || !/^https?:\/\//i.test(coverImage)) {
      onChangeCoverImage(url);
      if (onChangeGalleryImages) {
        onChangeGalleryImages([url]);
      }
    } else {
      const nextGallery = Array.from(
        new Set([
          ...(galleryImages || []).filter((p) => /^https?:\/\//i.test(p)),
          url,
        ])
      );
      if (onChangeGalleryImages) {
        onChangeGalleryImages(nextGallery);
      }
    }

    setUrlInput('');
    setErrorMsg(null);
  };

  const handleSetAsCover = (photoUrl: string) => {
    if (!/^https?:\/\//i.test(photoUrl)) return;
    onChangeCoverImage(photoUrl);
    if (onChangeGalleryImages) {
      const nextGallery = [photoUrl, ...allPhotos.filter((p) => p !== photoUrl)];
      onChangeGalleryImages(nextGallery);
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    const remaining = allPhotos.filter((p) => p !== photoUrl);
    if (photoUrl === coverImage) {
      onChangeCoverImage(remaining[0] || '');
    }
    if (onChangeGalleryImages) {
      onChangeGalleryImages(remaining);
    }
  };

  return (
    <div className="space-y-4">
      {/* Inputs ocultos para Galeria e Câmera com feedback claro */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={notifyLocalFileNotSupported}
        className="hidden"
        id="photo-upload-input"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={notifyLocalFileNotSupported}
        className="hidden"
        id="photo-camera-input"
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <label className="block font-bold text-gray-900 text-sm">
            {label}
          </label>
          <p className="text-xs text-gray-500">{description}</p>
        </div>

        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
          {allPhotos.length} de {maxFiles} fotos
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-800 text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Opção Principal e Obrigatória: Adicionar por Link/URL */}
      <div className="space-y-2 bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-[#DE1F2A]" />
            <span className="text-xs font-bold text-gray-900">
              Adicionar foto por link (URL pública com https://)
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Formato aceito pela API
          </span>
        </div>

        <div className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="https://exemplo.com/foto-do-local.jpg"
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 bg-[#DE1F2A] hover:bg-[#C51620] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
        <p className="text-[11px] text-gray-500">
          Aceita links diretos de fotos hospedadas no Imgur, Cloudinary, Instagram, Facebook ou site oficial.
        </p>
      </div>

      {/* Botões informativos para Câmera e Galeria local com aviso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opção 1: Escolher fotos da galeria ou arrastar */}
        <div
          onClick={() => notifyLocalFileNotSupported()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            notifyLocalFileNotSupported(e);
          }}
          className="border-2 border-dashed border-gray-200 hover:border-gray-300 bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition active:scale-[0.99] group min-h-[90px]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              notifyLocalFileNotSupported();
            }
          }}
          aria-label="Escolher fotos da galeria ou arrastar arquivos"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition">
              Escolher da Galeria / Arquivo Local
            </p>
            <p className="text-[10px] text-gray-400">
              Requer URL pública (clique para ver orientações)
            </p>
          </div>
        </div>

        {/* Opção 2: Tirar foto diretamente (Câmera no mobile) */}
        <button
          type="button"
          onClick={() => notifyLocalFileNotSupported()}
          className="border-2 border-dashed border-gray-200 hover:border-gray-300 bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 text-center transition active:scale-[0.99] group min-h-[90px]"
          aria-label="Tirar foto com a câmera"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-gray-700 transition">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 group-hover:text-gray-900 transition">
              Tirar Foto com a Câmera
            </p>
            <p className="text-[10px] text-gray-400">
              Requer URL pública (clique para ver orientações)
            </p>
          </div>
        </button>
      </div>


      {/* Grade de Fotos Carregadas & Seleção da Imagem Destacada (Capa) */}
      {allPhotos.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold text-gray-800">
              Galeria selecionada ({allPhotos.length}/{maxFiles})
            </span>
            <span className="text-[11px] text-gray-500">
              A foto com estrela vermelha é a <strong>Capa Principal</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allPhotos.map((photo, idx) => {
              const isCover = photo === coverImage;
              return (
                <div
                  key={idx}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 bg-gray-100 transition shadow-2xs ${
                    isCover
                      ? 'border-[#DE1F2A] ring-2 ring-[#DE1F2A]/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Badge de Capa */}
                  {isCover && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#DE1F2A] text-white shadow-xs flex items-center gap-1 z-10">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Capa (Destaque)</span>
                    </span>
                  )}

                  {/* Ações interativas */}
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetAsCover(photo)}
                        className="px-2 py-1 rounded-xl bg-white/90 hover:bg-white text-gray-900 text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                        title="Definir como foto de capa"
                      >
                        <Star className="w-3 h-3 text-amber-500" />
                        <span>Definir Capa</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo)}
                      className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
                      title="Remover foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Preview Categorizado quando nenhuma foto for enviada */
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-32 h-24 rounded-xl overflow-hidden shrink-0">
              <PlacePhotoPlaceholder
                categoryName={categoryName}
                categorySlug={categorySlug}
                placeName={placeName}
                size="thumb"
              />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Sem fotos anexadas ainda
              </span>
              <p className="text-xs font-semibold text-gray-800">
                O local será exibido inicialmente com a ilustração temática de {categoryName}.
              </p>
              <p className="text-[11px] text-gray-500">
                Recomendamos enviar pelo menos 1 foto para dar credibilidade e destacar a página na busca.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
