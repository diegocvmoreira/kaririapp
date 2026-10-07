import React from 'react';
import { X, Check, RotateCcw } from 'lucide-react';
import { City, Category, SearchFilters } from '../../types';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
  cities: City[];
  categories: Category[];
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  cities,
  categories,
}) => {
  const [localFilters, setLocalFilters] = React.useState<SearchFilters>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handlePriceToggle = (level: number) => {
    const current = localFilters.price_levels || [];
    const next = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    setLocalFilters({ ...localFilters, price_levels: next });
  };

  const handleReset = () => {
    setLocalFilters({
      city_slug: undefined,
      category_slug: undefined,
      min_rating: undefined,
      price_levels: [],
      open_now: false,
      sort_by: 'featured',
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Filtros de Descoberta</h3>
            <p className="text-xs text-gray-400">Refine os locais do Cariri</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            aria-label="Fechar filtros"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Cidade */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2.5">Município</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, city_slug: undefined })}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  !localFilters.city_slug
                    ? 'bg-[#D9262E] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas as Cidades
              </button>
              {cities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() =>
                    setLocalFilters({ ...localFilters, city_slug: city.slug })
                  }
                  className={`px-3 py-1.5 rounded-xl font-medium transition ${
                    localFilters.city_slug === city.slug
                      ? 'bg-[#D9262E] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2.5">Categoria</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setLocalFilters({ ...localFilters, category_slug: undefined })}
                className={`px-3 py-1.5 rounded-xl font-medium transition ${
                  !localFilters.category_slug
                    ? 'bg-[#1F2024] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setLocalFilters({ ...localFilters, category_slug: cat.slug })
                  }
                  className={`px-3 py-1.5 rounded-xl font-medium transition ${
                    localFilters.category_slug === cat.slug
                      ? 'bg-[#1F2024] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Aberto agora */}
          <div className="flex items-center justify-between py-2 border-y border-gray-100">
            <div>
              <p className="font-bold text-gray-800">Aberto agora</p>
              <p className="text-xs text-gray-500">Mostrar apenas estabelecimentos em atendimento</p>
            </div>
            <button
              type="button"
              onClick={() => setLocalFilters({ ...localFilters, open_now: !localFilters.open_now })}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                localFilters.open_now ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
            </button>
          </div>

          {/* Avaliação Mínima */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2.5">Avaliação</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Qualquer', val: undefined },
                { label: '4.5+ ★ Excelente', val: 4.5 },
                { label: '4.0+ ★ Muito bom', val: 4.0 },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, min_rating: item.val })}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition ${
                    localFilters.min_rating === item.val
                      ? 'bg-amber-400 text-gray-950 font-bold shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Faixa de Preço */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2.5">Faixa de Preço</h4>
            <div className="grid grid-cols-4 gap-2">
              {[
                { level: 1, label: '$ Econômico' },
                { level: 2, label: '$$ Moderado' },
                { level: 3, label: '$$$ Sofisticado' },
                { level: 4, label: '$$$$ Exclusivo' },
              ].map((p) => {
                const isSelected = (localFilters.price_levels || []).includes(p.level);
                return (
                  <button
                    key={p.level}
                    type="button"
                    onClick={() => handlePriceToggle(p.level)}
                    className={`py-2.5 px-1 rounded-xl text-center font-medium transition flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#1F2024] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="font-bold">{'$'.repeat(p.level)}</span>
                    <span className="text-[10px] opacity-80">{p.label.split(' ')[1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ordenação */}
          <div>
            <h4 className="font-bold text-gray-800 mb-2.5">Ordenar por</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'featured', label: 'Relevância / Destaques' },
                { id: 'rating', label: 'Melhor Avaliados' },
                { id: 'distance', label: 'Mais Próximos' },
                { id: 'reviews', label: 'Mais Comentados' },
              ].map((sort) => (
                <button
                  key={sort.id}
                  type="button"
                  onClick={() =>
                    setLocalFilters({
                      ...localFilters,
                      sort_by: sort.id as SearchFilters['sort_by'],
                    })
                  }
                  className={`py-2 px-3 rounded-xl text-left font-medium flex items-center justify-between transition ${
                    (localFilters.sort_by || 'featured') === sort.id
                      ? 'bg-[#FDE8E9] text-[#D9262E] font-bold ring-1 ring-[#D9262E]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xs">{sort.label}</span>
                  {(localFilters.sort_by || 'featured') === sort.id && (
                    <Check className="w-3.5 h-3.5 text-[#D9262E]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl bg-[#D9262E] text-white font-bold hover:bg-[#BF1E25] active:scale-98 transition shadow-sm text-center"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
