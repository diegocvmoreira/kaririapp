import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Ocorreu uma falha ao conectar com o serviço.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#D9262E] flex items-center justify-center mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">
        Não foi possível carregar os dados
      </h3>
      <p className="text-xs text-gray-500 max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition active:scale-95 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      )}
    </div>
  );
};
