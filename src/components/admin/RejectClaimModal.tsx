import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface RejectClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  placeName?: string;
  userName?: string;
}

export const RejectClaimModal: React.FC<RejectClaimModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  placeName,
  userName,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">Rejeitar Reivindicação</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-gray-600">
          Você está rejeitando a solicitação de <strong>{userName}</strong> para o local <strong>{placeName}</strong>.
          Informe o motivo para registro administrativo:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Documentação comprobatória insuficiente ou não condizente com o CNPJ do estabelecimento."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-red-500"
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
