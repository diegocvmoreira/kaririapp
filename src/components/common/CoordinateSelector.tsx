import React, { useState } from 'react';
import { MapPin, Navigation, HelpCircle, CheckCircle2, AlertTriangle, Crosshair, ChevronDown, ChevronUp } from 'lucide-react';

interface CoordinateSelectorProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null, source?: string) => void;
  cityName?: string;
  cityLat?: number | null;
  cityLng?: number | null;
  address?: string;
}

export const CoordinateSelector: React.FC<CoordinateSelectorProps> = ({
  latitude,
  longitude,
  onChange,
  cityName = 'Cariri',
  cityLat = null,
  cityLng = null,
  address = '',
}) => {
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [coordType, setCoordType] = useState<'none' | 'gps' | 'city_approx' | 'manual'>(
    latitude !== null && longitude !== null ? 'manual' : 'none'
  );

  const hasCoords = latitude !== null && longitude !== null && !isNaN(latitude) && !isNaN(longitude);

  // Caminho 1: GPS do usuário
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsGettingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setCoordType('gps');
        setIsGettingGps(false);
        onChange(lat, lng, 'user_geolocation');
      },
      (err) => {
        setIsGettingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Permissão de localização negada no navegador. Você pode digitar manualmente ou deixar para a moderação.');
        } else {
          setGpsError('Não foi possível obter a localização exata no momento.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Caminho 2: Aproximar pelo centro da cidade selecionada
  const handleUseCityCenter = () => {
    // Defaults conhecidos das cidades do Cariri caso não venham preenchidos
    let lat = cityLat;
    let lng = cityLng;

    const lowerCity = (cityName || '').toLowerCase();
    if (!lat || !lng) {
      if (lowerCity.includes('crato')) {
        lat = -7.2341;
        lng = -39.4124;
      } else if (lowerCity.includes('juazeiro')) {
        lat = -7.2025;
        lng = -39.3150;
      } else if (lowerCity.includes('barbalha')) {
        lat = -7.3094;
        lng = -39.3039;
      }
    }

    if (lat && lng) {
      setCoordType('city_approx');
      setGpsError(null);
      setGpsAccuracy(null);
      onChange(lat, lng, 'city_center_approx');
    }
  };

  // Caminho 3: Não sei as coordenadas / Moderação confirma
  const handleClearCoords = () => {
    setCoordType('none');
    setGpsError(null);
    setGpsAccuracy(null);
    onChange(null, null, 'unknown');
  };

  const handleManualLatChange = (val: string) => {
    const parsed = val.trim() === '' ? null : parseFloat(val);
    setCoordType('manual');
    onChange(parsed, longitude, 'manual');
  };

  const handleManualLngChange = (val: string) => {
    const parsed = val.trim() === '' ? null : parseFloat(val);
    setCoordType('manual');
    onChange(latitude, parsed, 'manual');
  };

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-gray-50 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <label className="block font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#DE1F2A]" />
            <span>Coordenadas Geográficas (GPS)</span>
          </label>
          <p className="text-xs text-gray-500">
            Necessárias para traçar rotas e exibir a distância no mapa.
          </p>
        </div>

        {/* Status atual */}
        <div>
          {hasCoords ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                coordType === 'city_approx'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{coordType === 'city_approx' ? 'Aproximação do Município' : 'Definidas'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-200 text-gray-700">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Não informadas (serão confirmadas)</span>
            </span>
          )}
        </div>
      </div>

      {gpsError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Os 3 Caminhos Explícitos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Caminho 1: Usar GPS */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isGettingGps}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            coordType === 'gps'
              ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Navigation className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">1. Usar meu GPS</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            {isGettingGps
              ? 'Acessando localização do dispositivo...'
              : gpsAccuracy
              ? `Capturado com precisão de ±${gpsAccuracy}m`
              : 'Se você estiver no local agora'}
          </p>
        </button>

        {/* Caminho 2: Aproximar pelo centro da cidade */}
        <button
          type="button"
          onClick={handleUseCityCenter}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            coordType === 'city_approx'
              ? 'border-amber-400 bg-amber-50/50 text-amber-950'
              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">2. Centro de {cityName}</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            Aproximar pelo município e refinar na moderação
          </p>
        </button>

        {/* Caminho 3: Ainda não sei */}
        <button
          type="button"
          onClick={handleClearCoords}
          className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
            !hasCoords
              ? 'border-blue-400 bg-blue-50/50 text-blue-950'
              : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold">3. Ainda não sei</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-tight">
            A equipe do Kariri.app localizará pelo endereço
          </p>
        </button>
      </div>

      {/* Aviso educativo quando usa aproximação */}
      {coordType === 'city_approx' && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Aviso de Aproximação:</strong> As coordenadas foram marcadas provisoriamente no centro de {cityName}. A equipe editorial verificará o endereço exato antes de aprovar.
          </span>
        </div>
      )}

      {/* Informação quando salva sem coordenadas */}
      {!hasCoords && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Nenhuma coordenada falsa será associada. O local será cadastrado e localizado no mapa por nossa equipe com base em: <em>{address || 'endereço e bairro informados'}</em>.
          </span>
        </div>
      )}

      {/* Seção recolhível de ajuste manual de Latitude e Longitude */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1 transition"
        >
          <span>{showAdvanced ? 'Ocultar campos numéricos de coordenadas' : 'Ajustar latitude e longitude manualmente'}</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Latitude (ex: -7.234100)
              </label>
              <input
                type="number"
                step="any"
                value={latitude !== null ? latitude : ''}
                onChange={(e) => handleManualLatChange(e.target.value)}
                placeholder="Vazio (sem coordenadas)"
                className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Longitude (ex: -39.412400)
              </label>
              <input
                type="number"
                step="any"
                value={longitude !== null ? longitude : ''}
                onChange={(e) => handleManualLngChange(e.target.value)}
                placeholder="Vazio (sem coordenadas)"
                className="w-full p-2 bg-white border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
