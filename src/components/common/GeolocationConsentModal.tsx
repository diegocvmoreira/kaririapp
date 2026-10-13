import React, { useState } from 'react';
import { Navigation, ShieldCheck, MapPin, X, Check } from 'lucide-react';

interface GeolocationConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentGranted: (coords: { latitude: number; longitude: number }) => void;
  onManualSelect: () => void;
}

export const GeolocationConsentModal: React.FC<GeolocationConsentModalProps> = ({
  isOpen,
  onClose,
  onConsentGranted,
  onManualSelect,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestLocation = () => {
    setIsLocating(true);
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage('Geolocalização não é suportada pelo seu navegador. Por favor, selecione manualmente.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onConsentGranted({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        onClose();
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage('Permissão negada no navegador. Você pode selecionar a cidade manualmente abaixo.');
        } else {
          setErrorMessage('Não foi possível obter sua localização no momento. Use a seleção manual.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos de cache - sem rastreamento contínuo
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#DE1F2A] flex items-center justify-center mb-1">
          <Navigation className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold text-gray-900">
            Usar sua localização para ordenar locais?
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            O <strong>Kariri.app</strong> solicita sua localização aproximada com uma única finalidade:
            <strong> calcular a distância e ordenar os estabelecimentos e eventos do Cariri mais próximos de você</strong>.
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 space-y-2 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">Privacidade garantida:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                <li>Não rastreamos seu GPS continuamente.</li>
                <li>Sua cidade natal nunca é substituída por coordenadas de GPS.</li>
                <li>Você pode recusar e navegar normalmente escolhendo qualquer cidade do Cariri.</li>
              </ul>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={isLocating}
            className="w-full py-3 bg-[#DE1F2A] hover:bg-[#C51620] active:scale-98 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            <span>{isLocating ? 'Obtendo localização...' : 'Permitir localização'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onManualSelect();
            }}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4 text-gray-600" />
            <span>Escolher cidade manualmente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
