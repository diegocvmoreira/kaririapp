import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Sparkles, Check, Copy, AlertCircle, Edit3, Calendar } from 'lucide-react';

export interface OpeningHoursEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxChars?: number;
}

interface DayState {
  key: string;
  shortLabel: string;
  fullLabel: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const DEFAULT_DAYS: DayState[] = [
  { key: 'monday', shortLabel: 'Seg', fullLabel: 'Segunda', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { key: 'tuesday', shortLabel: 'Ter', fullLabel: 'Terça', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { key: 'wednesday', shortLabel: 'Qua', fullLabel: 'Quarta', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { key: 'thursday', shortLabel: 'Qui', fullLabel: 'Quinta', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { key: 'friday', shortLabel: 'Sex', fullLabel: 'Sexta', isOpen: true, openTime: '08:00', closeTime: '18:00' },
  { key: 'saturday', shortLabel: 'Sáb', fullLabel: 'Sábado', isOpen: true, openTime: '08:00', closeTime: '12:00' },
  { key: 'sunday', shortLabel: 'Dom', fullLabel: 'Domingo', isOpen: false, openTime: '08:00', closeTime: '12:00' },
];

interface Preset {
  id: string;
  name: string;
  icon: string;
  description: string;
  days: Omit<DayState, 'key' | 'shortLabel' | 'fullLabel'>[];
}

const PRESETS: Preset[] = [
  {
    id: 'comercial',
    name: 'Comércio / Escritório',
    icon: '🏢',
    description: 'Seg a Sex: 08:00 às 18:00, Sáb: 08:00 às 12:00',
    days: [
      { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { isOpen: true, openTime: '08:00', closeTime: '12:00' },
      { isOpen: false, openTime: '08:00', closeTime: '12:00' },
    ],
  },
  {
    id: 'restaurante',
    name: 'Restaurante / Bar',
    icon: '🍽️',
    description: 'Ter a Dom: 11:30 às 23:00 (Segunda fechado)',
    days: [
      { isOpen: false, openTime: '11:30', closeTime: '23:00' },
      { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      { isOpen: true, openTime: '11:30', closeTime: '23:00' },
      { isOpen: true, openTime: '11:30', closeTime: '23:00' },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping / Varejo',
    icon: '🛍️',
    description: 'Seg a Sáb: 10:00 às 22:00, Dom: 14:00 às 20:00',
    days: [
      { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { isOpen: true, openTime: '10:00', closeTime: '22:00' },
      { isOpen: true, openTime: '14:00', closeTime: '20:00' },
    ],
  },
  {
    id: 'cafe',
    name: 'Cafeteria / Padaria',
    icon: '☕',
    description: 'Seg a Sáb: 06:30 às 19:30, Dom: 07:00 às 13:00',
    days: [
      { isOpen: true, openTime: '06:30', closeTime: '19:30' },
      { isOpen: true, openTime: '06:30', closeTime: '19:30' },
      { isOpen: true, openTime: '06:30', closeTime: '19:30' },
      { isOpen: true, openTime: '06:30', closeTime: '19:30' },
      { isOpen: true, openTime: '06:30', closeTime: '19:30' },
      { isOpen: true, openTime: '06:30', closeTime: '19:30' },
      { isOpen: true, openTime: '07:00', closeTime: '13:00' },
    ],
  },
  {
    id: '24h',
    name: 'Operação 24 Horas',
    icon: '⚡',
    description: 'Todos os dias: 24 horas ininterruptas',
    days: [
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
      { isOpen: true, openTime: '00:00', closeTime: '23:59' },
    ],
  },
];

/**
 * Converte o array de dias para a string padronizada do banco (VARCHAR 255 compatível)
 */
function compileSchedule(days: DayState[]): string {
  const allClosed = days.every((d) => !d.isOpen);
  if (allClosed) {
    return 'Temporariamente fechado';
  }

  const all24h = days.every((d) => d.isOpen && d.openTime === '00:00' && (d.closeTime === '23:59' || d.closeTime === '00:00'));
  if (all24h) {
    return 'Todos os dias: 24 horas';
  }

  // Verifica se todos os 7 dias têm exatamente o mesmo horário
  const allSameOpen = days.every(
    (d) => d.isOpen === days[0].isOpen && d.openTime === days[0].openTime && d.closeTime === days[0].closeTime
  );
  if (allSameOpen && days[0].isOpen) {
    return `Todos os dias: ${days[0].openTime} - ${days[0].closeTime}`;
  }

  // Agrupa dias consecutivos com status e horários iguais
  interface Group {
    start: string;
    end: string;
    isOpen: boolean;
    hours: string;
  }

  const groups: Group[] = [];
  for (const day of days) {
    const hours = day.isOpen ? `${day.openTime} - ${day.closeTime}` : 'Fechado';
    const last = groups[groups.length - 1];

    if (last && last.isOpen === day.isOpen && last.hours === hours) {
      last.end = day.shortLabel;
    } else {
      groups.push({
        start: day.shortLabel,
        end: day.shortLabel,
        isOpen: day.isOpen,
        hours,
      });
    }
  }

  // Constrói texto resumido
  return groups
    .map((g) => {
      const range = g.start === g.end ? g.start : `${g.start} a ${g.end}`;
      return `${range}: ${g.hours}`;
    })
    .join(' • ');
}

/**
 * Tenta inferir os dias a partir de uma string ou JSON existente
 */
function parseInitialSchedule(value: string): { days: DayState[]; isCustom: boolean } {
  if (!value || typeof value !== 'string') {
    return { days: DEFAULT_DAYS, isCustom: false };
  }

  const trimmed = value.trim();

  // Caso 24 horas
  if (/24\s*(h|horas)/i.test(trimmed)) {
    return {
      days: DEFAULT_DAYS.map((d) => ({ ...d, isOpen: true, openTime: '00:00', closeTime: '23:59' })),
      isCustom: false,
    };
  }

  // Tenta analisar se é JSON serializado
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const days = DEFAULT_DAYS.map((d) => {
        const val = parsed[d.key] || parsed[d.shortLabel.toLowerCase()] || parsed[d.fullLabel.toLowerCase()];
        if (!val || val === 'closed' || val === 'Fechado') {
          return { ...d, isOpen: false };
        }
        if (typeof val === 'string') {
          const times = val.match(/(\d{1,2}:\d{2})/g);
          if (times && times.length >= 2) {
            return { ...d, isOpen: true, openTime: times[0], closeTime: times[1] };
          }
        }
        return d;
      });
      return { days, isCustom: false };
    } catch {
      // Ignora erro de JSON e cai no fallback
    }
  }

  // Tenta detectar padrões de horários clássicos (ex: "Seg a Sex: 08:00 - 18:00")
  if (trimmed.includes(' - ') || trimmed.includes(' • ') || trimmed.includes(':')) {
    const times = trimmed.match(/(\d{1,2}:\d{2})/g);
    if (times && times.length >= 2) {
      // Usa os dois primeiros horários detectados como base para o editor
      const openTime = times[0].padStart(5, '0');
      const closeTime = times[1].padStart(5, '0');

      const isSegSex = /seg.*sex/i.test(trimmed);
      const isSegSab = /seg.*s[aá]b/i.test(trimmed);

      const days = DEFAULT_DAYS.map((d) => {
        if (d.key === 'sunday') {
          const sunOpen = /dom.*(\d{1,2}:\d{2})/i.test(trimmed);
          return { ...d, isOpen: sunOpen, openTime, closeTime };
        }
        if (d.key === 'saturday') {
          return { ...d, isOpen: isSegSab || !isSegSex, openTime, closeTime };
        }
        return { ...d, isOpen: true, openTime, closeTime };
      });

      return { days, isCustom: false };
    }
  }

  // Caso seja texto livre (ex: "Apenas com agendamento", "Sob consulta")
  return { days: DEFAULT_DAYS, isCustom: true };
}

export const OpeningHoursEditor: React.FC<OpeningHoursEditorProps> = ({
  value,
  onChange,
  maxChars = 255,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'manual'>('visual');
  const [days, setDays] = useState<DayState[]>(DEFAULT_DAYS);
  const [manualText, setManualText] = useState(value || '');

  // Inicializa o estado a partir do valor recebido
  useEffect(() => {
    if (value) {
      setManualText(value);
      const parsed = parseInitialSchedule(value);
      if (parsed.isCustom) {
        setActiveTab('manual');
      } else {
        setDays(parsed.days);
      }
    }
  }, [value]);

  // Atualiza valor compilado quando os dias mudam
  const compiledValue = useMemo(() => {
    return compileSchedule(days);
  }, [days]);

  // Atualiza para o componente pai quando no modo visual
  const handleDayChange = (index: number, patch: Partial<DayState>) => {
    const nextDays = days.map((d, i) => (i === index ? { ...d, ...patch } : d));
    setDays(nextDays);
    const compiled = compileSchedule(nextDays);
    setManualText(compiled);
    onChange(compiled);
  };

  // Aplica um preset rápido
  const applyPreset = (preset: Preset) => {
    const nextDays = days.map((d, i) => ({
      ...d,
      ...preset.days[i],
    }));
    setDays(nextDays);
    const compiled = compileSchedule(nextDays);
    setManualText(compiled);
    onChange(compiled);
  };

  // Replica horário da Segunda-feira para Terça a Sexta
  const copyMondayToWeekdays = () => {
    const monday = days[0];
    const nextDays = days.map((d) => {
      if (['tuesday', 'wednesday', 'thursday', 'friday'].includes(d.key)) {
        return {
          ...d,
          isOpen: monday.isOpen,
          openTime: monday.openTime,
          closeTime: monday.closeTime,
        };
      }
      return d;
    });
    setDays(nextDays);
    const compiled = compileSchedule(nextDays);
    setManualText(compiled);
    onChange(compiled);
  };

  // Manipula alteração no modo manual
  const handleManualChange = (newVal: string) => {
    setManualText(newVal);
    onChange(newVal);
  };

  const currentLength = (activeTab === 'visual' ? compiledValue : manualText).length;
  const isOverLimit = currentLength > maxChars;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3.5 space-y-3.5 shadow-xs">
      {/* Cabeçalho com Abas e Contador */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-[#DE1F2A]" />
          <span className="font-bold text-gray-800 text-xs sm:text-sm">Horário de Funcionamento</span>
        </div>

        {/* Alternador de Modo: Visual vs Texto */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('visual');
              onChange(compiledValue);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              activeTab === 'visual'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#DE1F2A]" />
            <span>Seletor Semanal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
              activeTab === 'manual'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Texto Livre</span>
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="space-y-3">
          {/* Presets Rápidos */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Modelos Pré-definidos (1 toque)</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-1.5 p-2 text-left bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-gray-100 rounded-xl transition text-xs group"
                  title={preset.description}
                >
                  <span className="text-sm shrink-0">{preset.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate group-hover:text-[#DE1F2A]">
                      {preset.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Atalho Rápido para Replicar Seg-Sex */}
          <div className="flex items-center justify-between bg-blue-50/70 border border-blue-100 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-blue-900 font-medium">Configurou a Segunda?</span>
            <button
              type="button"
              onClick={copyMondayToWeekdays}
              className="flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copiar para Ter-Sex</span>
            </button>
          </div>

          {/* Lista de Dias da Semana */}
          <div className="space-y-1.5 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
            {days.map((day, idx) => (
              <div
                key={day.key}
                className={`flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl transition ${
                  day.isOpen ? 'bg-white border border-gray-200 shadow-2xs' : 'bg-gray-100/60 opacity-80'
                }`}
              >
                {/* Nome do Dia e Toggle Aberto/Fechado */}
                <div className="flex items-center gap-2 min-w-[120px]">
                  <button
                    type="button"
                    onClick={() => handleDayChange(idx, { isOpen: !day.isOpen })}
                    className={`w-7 h-5 rounded-full flex items-center p-0.5 transition cursor-pointer ${
                      day.isOpen ? 'bg-emerald-500 justify-end' : 'bg-gray-300 justify-start'
                    }`}
                    aria-label={`Alternar ${day.fullLabel}`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>

                  <span
                    className={`font-semibold text-xs ${
                      day.isOpen ? 'text-gray-900' : 'text-gray-400 line-through'
                    }`}
                  >
                    {day.fullLabel}
                  </span>
                </div>

                {/* Horários */}
                {day.isOpen ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <input
                      type="time"
                      value={day.openTime}
                      onChange={(e) => handleDayChange(idx, { openTime: e.target.value })}
                      className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-[#DE1F2A]"
                    />
                    <span className="text-gray-400 text-[11px] font-medium">às</span>
                    <input
                      type="time"
                      value={day.closeTime}
                      onChange={(e) => handleDayChange(idx, { closeTime: e.target.value })}
                      className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-[#DE1F2A]"
                    />
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-gray-400 italic">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Modo Manual (Texto Livre) */
        <div className="space-y-2">
          <textarea
            rows={3}
            value={manualText}
            onChange={(e) => handleManualChange(e.target.value)}
            placeholder="Ex: Terça a Domingo, das 11h30 às 23h • Feriados sob agendamento"
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#DE1F2A] text-xs sm:text-sm font-medium"
          />
          <p className="text-[11px] text-gray-500">
            Dica: use este modo para regras especiais, plantões ou horários excepcionais.
          </p>
        </div>
      )}

      {/* Caixa de Pré-visualização e Conformidade com o Banco de Dados */}
      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-emerald-900 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Como será salvo no banco de dados (Laravel):</span>
          </span>
          <span
            className={`font-mono text-[10px] font-bold ${
              isOverLimit ? 'text-red-600' : 'text-emerald-700'
            }`}
          >
            {currentLength} / {maxChars} caracteres
          </span>
        </div>

        <p className="text-gray-800 font-semibold bg-white/90 p-2 rounded-lg border border-emerald-100 break-words font-mono text-[11px]">
          {(activeTab === 'visual' ? compiledValue : manualText) || '(Nenhum horário definido)'}
        </p>

        {isOverLimit && (
          <div className="flex items-center gap-1 text-red-600 font-semibold text-[11px] mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Texto muito longo! O limite da coluna do banco é {maxChars} caracteres.</span>
          </div>
        )}
      </div>
    </div>
  );
};
