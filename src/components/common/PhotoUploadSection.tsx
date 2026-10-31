import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  X,
  Star,
  Link as LinkIcon,
  Plus,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Check,
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

// Compressão no cliente via Canvas: redimensiona e remove metadados sensíveis (EXIF)
const compressImage = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Converte para JPEG com compressão controlada
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUrlOption, setShowUrlOption] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Consolida lista de todas as fotos sem duplicatas vazias
  const allPhotos = Array.from(new Set([coverImage, ...galleryImages].filter(Boolean)));

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMsg(null);

    const remainingSlots = maxFiles - allPhotos.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Limite máximo de ${maxFiles} imagens atingido (1 capa + 8 adicionais).`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    setIsProcessing(true);

    try {
      const compressedList: string[] = [];

      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
          setErrorMsg('Selecione apenas arquivos de imagem válidos (JPEG, PNG, WEBP).');
          continue;
        }
        if (file.size > 15 * 1024 * 1024) {
          setErrorMsg(`O arquivo "${file.name}" excede o limite máximo de 15MB.`);
          continue;
        }

        const compressed = await compressImage(file);
        compressedList.push(compressed);
      }

      if (compressedList.length > 0) {
        if (!coverImage) {
          onChangeCoverImage(compressedList[0]);
          const remainingNew = compressedList.slice(1);
          if (onChangeGalleryImages) {
            onChangeGalleryImages(Array.from(new Set([...(galleryImages || []), ...remainingNew])));
          }
        } else {
          if (onChangeGalleryImages) {
            onChangeGalleryImages(Array.from(new Set([...(galleryImages || []), ...compressedList])));
          }
        }
      }
    } catch {
      setErrorMsg('Ocorreu um erro ao processar uma ou mais imagens. Tente novamente.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setErrorMsg('Informe uma URL de imagem válida iniciando com https://');
      return;
    }

    if (!coverImage) {
      onChangeCoverImage(url);
      if (onChangeGalleryImages) {
        onChangeGalleryImages([url]);
      }
    } else {
      const nextGallery = Array.from(new Set([...(galleryImages || []), url]));
      if (onChangeGalleryImages) {
        onChangeGalleryImages(nextGallery);
      }
    }

    setUrlInput('');
    setErrorMsg(null);
  };

  const handleSetAsCover = (photoUrl: string) => {
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
      {/* Inputs ocultos para Galeria e Câmera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => processFiles(e.target.files)}
        className="hidden"
        id="photo-upload-input"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => processFiles(e.target.files)}
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

      {/* Botões de Ação de Upload: Câmera, Galeria / Arquivos e Drag-and-drop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Opção 1: Escolher fotos da galeria ou arrastar */}
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isProcessing && e.dataTransfer.files) {
              processFiles(e.dataTransfer.files);
            }
          }}
          className="border-2 border-dashed border-gray-200 hover:border-[#DE1F2A] bg-gray-50/70 hover:bg-[#FDE8E9]/15 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition active:scale-[0.99] group min-h-[120px]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Escolher fotos da galeria ou arrastar arquivos"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-[#DE1F2A] transition">
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-[#DE1F2A]" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#DE1F2A] transition">
              {isProcessing ? 'Otimizando fotos...' : 'Escolher da Galeria / Arquivos'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Clique ou arraste até {maxFiles - allPhotos.length} foto(s)
            </p>
          </div>
        </div>

        {/* Opção 2: Tirar foto diretamente (Câmera no mobile) */}
        <button
          type="button"
          onClick={() => !isProcessing && cameraInputRef.current?.click()}
          disabled={isProcessing || allPhotos.length >= maxFiles}
          className="border-2 border-dashed border-gray-200 hover:border-[#DE1F2A] bg-gray-50/70 hover:bg-[#FDE8E9]/15 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center transition active:scale-[0.99] group disabled:opacity-50 min-h-[120px]"
          aria-label="Tirar foto com a câmera"
        >
          <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-[#DE1F2A] transition">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#DE1F2A] transition">
              Tirar Foto Agora
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Use a câmera do seu celular ou tablet
            </p>
          </div>
        </button>
      </div>

      {/* Opção Avançada: Adicionar por Link/URL */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlOption(!showUrlOption)}
          className="text-xs text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1.5 transition"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>{showUrlOption ? 'Ocultar opção de adicionar foto por link (URL)' : 'Opção avançada: adicionar foto por link externo (URL)'}</span>
          {showUrlOption ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showUrlOption && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 animate-in fade-in duration-150">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://exemplo.com/foto-do-local.jpg"
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <button
              type="button"
              onClick={handleAddUrl}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        )}
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
