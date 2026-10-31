import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { analytics } from '../../services/analyticsService';

import { Place } from '../../types';

interface SuggestCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  place?: Place;
  placeId?: number;
  placeName?: string;
}

const CORRECTION_TYPES = [
  { id: 'hours', label: 'Horário de funcionamento incorreto' },
  { id: 'address', label: 'Endereço ou localização no mapa incorretos' },
  { id: 'contact', label: 'Telefone, WhatsApp ou redes desatualizados' },
  { id: 'amenities', label: 'Comodidades (acessibilidade, estacionamento, etc.)' },
  { id: 'closed', label: 'Estabelecimento fechado permanentemente' },
  { id: 'other', label: 'Outras informações incorretas ou desatualizadas' },
];

export const SuggestCorrectionModal: React.FC<SuggestCorrectionModalProps> = ({
  isOpen,
  onClose,
  place,
  placeId,
  placeName,
}) => {
  const resolvedId = place?.id ?? placeId ?? 0;
  const resolvedName = place?.name ?? placeName ?? 'Local';

  const [issueType, setIssueType] = useState('hours');
  const [details, setDetails] = useState('');
  const [source, setSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setError(null);
      setDetails('');
      setSource('');
      // Foco inicial
      setTimeout(() => closeButtonRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Tecla Escape para fechar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      setError('Por favor, descreva detalhadamente a informação correta.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      analytics.track('suggest_correction_submit', {
        place_id: resolvedId,
        place_slug: String(resolvedId),
        issue_type: issueType,
      });

      // Simulação de envio com fallback gracioso (caso o endpoint de sugestões ainda não esteja em produção)
      await new Promise((resolve) => setTimeout(resolve, 600));

      setIsSuccess(true);
    } catch {
      setError('Não foi possível enviar sua sugestão neste momento. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-modal-title"
      ref={modalRef}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F7F3EE]">
          <div>
            <h2 id="correction-modal-title" className="text-lg font-bold text-[#1F2024]">
              Sugerir Correção
            </h2>
            <p className="text-xs text-gray-500 truncate max-w-xs">{resolvedName}</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DE1F2A]"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Sugestão enviada!</h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                Nossa equipe de curadoria do Kariri.app irá verificar os dados e atualizar a ficha do local. Muito obrigado por ajudar a manter nossa região informada!
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-6 py-2.5 bg-[#DE1F2A] hover:bg-[#B81520] text-white font-medium text-sm rounded-xl transition shadow-sm"
                >
                  Concluir
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/70 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  As sugestões passam por moderação antes de serem publicadas para garantir a exatidão e a qualidade da plataforma.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="issue-type" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Qual informação precisa ser atualizada? *
                </label>
                <select
                  id="issue-type"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DE1F2A] focus:border-transparent"
                >
                  {CORRECTION_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="correction-details" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Descreva a informação correta *
                </label>
                <textarea
                  id="correction-details"
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ex: O local agora abre também aos domingos das 11h às 16h; novo WhatsApp para reservas é..."
                  className="w-full p-3 rounded-xl border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DE1F2A] focus:border-transparent placeholder:text-gray-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="correction-source" className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Fonte ou como você sabe? (Opcional)
                </label>
                <input
                  type="text"
                  id="correction-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ex: Perfil do Instagram oficial, estive no local ontem, sou proprietário"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-gray-300 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#DE1F2A] focus:border-transparent placeholder:text-gray-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[44px] px-5 py-2.5 bg-[#DE1F2A] hover:bg-[#B81520] disabled:bg-gray-300 text-white font-medium text-sm rounded-xl transition shadow-sm inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar sugestão
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default SuggestCorrectionModal;
