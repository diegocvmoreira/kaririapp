import React, { useState, useEffect } from 'react';
import { City } from '../../types';
import { X, MapPin, Check, AlertCircle } from 'lucide-react';

interface CityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cityData: Partial<City>) => Promise<void>;
  city?: City | null;
}

export const CityFormModal: React.FC<CityFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  city,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [state, setState] = useState('CE');
  const [country, setCountry] = useState('Brasil');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [isCaririRegion, setIsCaririRegion] = useState(true);
  const [image, setImage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (city) {
      setName(city.name);
      setSlug(city.slug);
      setState(city.state);
      setCountry(city.country || 'Brasil');
      setLatitude(city.latitude !== null && city.latitude !== undefined ? String(city.latitude) : '');
      setLongitude(city.longitude !== null && city.longitude !== undefined ? String(city.longitude) : '');
      setStatus(city.is_active ? 'active' : 'inactive');
      setIsCaririRegion(city.is_cariri_region ?? true);
      setImage(city.image || '');
    } else {
      setName('');
      setSlug('');
      setState('CE');
      setCountry('Brasil');
      setLatitude('');
      setLongitude('');
      setStatus('active');
      setIsCaririRegion(true);
      setImage('');
    }
    setErrorMsg(null);
  }, [city, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!city) {
      // Auto-gera slug apenas ao criar
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome da cidade.');
      return;
    }
    if (!slug.trim()) {
      setErrorMsg('Informe o slug da cidade.');
      return;
    }

    let parsedLat: number | null = null;
    let parsedLng: number | null = null;

    if (latitude.trim() !== '') {
      const val = parseFloat(latitude);
      if (isNaN(val)) {
        setErrorMsg('Latitude inválida. Deixe em branco se a cidade não possuir coordenadas.');
        return;
      }
      parsedLat = val;
    }

    if (longitude.trim() !== '') {
      const val = parseFloat(longitude);
      if (isNaN(val)) {
        setErrorMsg('Longitude inválida. Deixe em branco se a cidade não possuir coordenadas.');
        return;
      }
      parsedLng = val;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        state: state.trim().toUpperCase(),
        country: country.trim(),
        latitude: parsedLat,
        longitude: parsedLng,
        status,
        is_active: status === 'active',
        is_cariri_region: isCaririRegion,
        image: image.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao salvar cidade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#DE1F2A] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {city ? 'Editar Cidade' : 'Cadastrar Nova Cidade'}
              </h2>
              <p className="text-xs text-gray-400">
                Gestão territorial administrável do Kariri.app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-[#DE1F2A] text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nome da Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="Ex: Barbalha"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Slug único <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ex: barbalha"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Estado / UF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="CE"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                País
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Brasil"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              >
                <option value="active">Ativa</option>
                <option value="inactive">Inativa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Latitude (Opcional)
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Ex: -7.3117 (ou vazio)"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Deixe em branco se não confirmada.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Longitude (Opcional)
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Ex: -39.3039 (ou vazio)"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">Deixe em branco se não confirmada.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              URL da Imagem de Capa (Opcional)
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A]"
            />
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200/60 rounded-2xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isCaririRegion}
                onChange={(e) => setIsCaririRegion(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#DE1F2A] rounded border-gray-300 focus:ring-[#DE1F2A]"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">
                  Pertence à região coberta pelo catálogo do Kariri
                </span>
                <span className="text-[11px] text-gray-500 leading-tight block">
                  Cidades com esta marcação aparecem no catálogo e filtros do guia cultural. Cidades desmarcadas servem para cadastro e procedência de usuários.
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#DE1F2A] hover:bg-[#C51620] text-white rounded-xl font-bold text-xs sm:text-sm shadow-sm transition disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : city ? 'Atualizar Cidade' : 'Cadastrar Cidade'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-xs sm:text-sm transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
