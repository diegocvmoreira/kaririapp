import React, { useState, useEffect, useRef } from 'react';
import { City } from '../../types';
import { citiesApi } from '../../services/api/cities';
import { MapPin, Check, Search, Globe, AlertCircle, Sparkles } from 'lucide-react';

interface CitySelectorInputProps {
  label: string;
  placeholder?: string;
  helperText?: string;
  selectedCityId?: number | null;
  selectedCityName?: string | null;
  onSelect: (selection: { cityId: number | null; cityName: string; isCariri: boolean }) => void;
  caririOnly?: boolean;
  required?: boolean;
  className?: string;
}

export const CitySelectorInput: React.FC<CitySelectorInputProps> = ({
  label,
  placeholder = 'Digite o nome da cidade...',
  helperText,
  selectedCityId,
  selectedCityName,
  onSelect,
  caririOnly = false,
  required = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(selectedCityName || '');
  const [results, setResults] = useState<City[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCityName !== undefined && selectedCityName !== null) {
      setInputValue(selectedCityName);
    }
  }, [selectedCityName]);

  // Carrega cidade selecionada se ID for fornecido
  useEffect(() => {
    if (selectedCityId) {
      citiesApi.getAll().then((all) => {
        const found = all.find((c) => c.id === selectedCityId);
        if (found) {
          setSelectedCity(found);
          const formatted = `${found.name} (${found.state}) - ${found.country || 'Brasil'}`;
          setInputValue(formatted);
        }
      });
    }
  }, [selectedCityId]);

  // Efeito de busca com debounce
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        let list: City[];
        if (caririOnly) {
          const cariri = await citiesApi.getCaririCities();
          const query = inputValue.toLowerCase().trim();
          list = query
            ? cariri.filter((c) => c.name.toLowerCase().includes(query))
            : cariri;
        } else {
          list = await citiesApi.search(inputValue);
        }
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen, caririOnly]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city: City) => {
    const formatted = `${city.name} (${city.state}) - ${city.country || 'Brasil'}`;
    setInputValue(formatted);
    setSelectedCity(city);
    setIsOpen(false);
    onSelect({
      cityId: city.id,
      cityName: formatted,
      isCariri: Boolean(city.is_cariri_region),
    });
  };

  const handleCustomTextChange = (text: string) => {
    setInputValue(text);
    setSelectedCity(null);
    setIsOpen(true);
    // Se o usuário digitar algo livre que ainda não está na lista, enviamos como nome textual
    onSelect({
      cityId: null,
      cityName: text,
      isCariri: false,
    });
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedCity(null);
    onSelect({
      cityId: null,
      cityName: '',
      isCariri: false,
    });
  };

  return (
    <div className={`space-y-1 relative ${className}`} ref={containerRef}>
      <label className="block text-xs font-bold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleCustomTextChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#DE1F2A] focus:bg-white transition"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs px-1"
            title="Limpar"
          >
            ✕
          </button>
        )}
      </div>

      {helperText && <p className="text-[11px] text-gray-500 leading-tight">{helperText}</p>}

      {/* Dropdown de sugestões e desambiguação */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-2xl shadow-xl divide-y divide-gray-100">
          {isLoading && (
            <div className="p-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <Search className="w-3.5 h-3.5 animate-spin" />
              <span>Buscando cidades...</span>
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="p-3 text-xs text-gray-500">
              <p className="font-semibold text-gray-700">Cidade não encontrada na base direta.</p>
              <p className="mt-1 text-[11px] text-gray-400">
                Você pode manter o nome digitado: <strong className="text-gray-700">"{inputValue}"</strong>. Ele será salvo no seu cadastro.
              </p>
            </div>
          )}

          {!isLoading &&
            results.map((city) => {
              const isSelected = selectedCity?.id === city.id || selectedCityId === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectCity(city)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs transition flex items-center justify-between hover:bg-red-50/50 ${
                    isSelected ? 'bg-red-50 font-semibold text-[#DE1F2A]' : 'text-gray-800'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold flex items-center gap-1.5">
                      {city.name}
                      <span className="text-[11px] font-normal text-gray-500">
                        ({city.state}) — {city.country || 'Brasil'}
                      </span>
                    </span>
                    <span className="text-[10px] flex items-center gap-1 mt-0.5">
                      {city.is_cariri_region ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          ✓ Guia Kariri
                        </span>
                      ) : (
                        <span className="text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          Fora da cobertura do guia
                        </span>
                      )}
                    </span>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-[#DE1F2A] shrink-0" />}
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};
