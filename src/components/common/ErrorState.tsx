import React, { useState } from 'react';
import { AlertCircle, RefreshCw, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { ApiDiagnosticReport } from '../../services/api/diagnostics';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  diagnostic?: ApiDiagnosticReport;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Não foi possível carregar os dados',
  message = 'Ocorreu uma falha ao conectar com o serviço.',
  onRetry,
  diagnostic,
}) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const getCategoryBadgeClass = (category?: string) => {
    switch (category) {
      case 'CORS':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CLOUDFLARE':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'ROTA':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'AUTENTICACAO':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FORMATO_JSON':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'REDE':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#D9262E] flex items-center justify-center mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h3 className="text-base font-bold text-gray-900 mb-1">
        {title}
      </h3>

      <p className="text-xs text-gray-600 max-w-sm mb-4 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-xl hover:bg-black transition active:scale-95 shadow-sm mb-3"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </button>
      )}

      {/* Diagnóstico Técnico (CORS, Cloudflare, Rota, Autenticação, Formato JSON) */}
      {diagnostic && (
        <div className="w-full mt-3 text-left">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-gray-700 transition mx-auto w-full py-1"
          >
            <Terminal className="w-3 h-3 text-gray-400" />
            <span>{showTechnical ? 'Ocultar diagnóstico técnico' : 'Diagnóstico técnico da API'}</span>
            {showTechnical ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTechnical && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 gap-2">
                <span className="font-bold text-gray-900 truncate">
                  {diagnostic.title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shrink-0 ${getCategoryBadgeClass(
                    diagnostic.category
                  )}`}
                >
                  {diagnostic.category}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Causa Técnica
                </span>
                <p className="text-gray-700 font-mono text-[11px] mt-0.5 leading-relaxed break-words">
                  {diagnostic.technicalDetails}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Ação Recomendada (Laravel)
                </span>
                <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">
                  {diagnostic.suggestedAction}
                </p>
              </div>

              {diagnostic.endpoint && (
                <div className="pt-1 border-t border-gray-200 text-[10px] text-gray-400 font-mono">
                  Rota testada: {diagnostic.endpoint}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
