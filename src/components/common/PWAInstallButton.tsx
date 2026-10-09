import React, { useState } from 'react';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'button' | 'compact';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className={`bg-gradient-to-r from-gray-900 to-gray-800 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DE1F2A] flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Instale o App Kariri</p>
              <p className="text-[11px] text-gray-300 leading-tight">Acesso rápido e offline no seu celular</p>
            </div>
          </div>
          <button
            onClick={install}
            className="px-3.5 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition shrink-0 shadow-sm"
          >
            Instalar
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DE1F2A] text-white text-xs font-semibold shadow-sm hover:bg-[#C51620] active:scale-95 transition ${className}`}
        aria-label="Instalar Kariri App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 active:scale-95 transition ${className}`}
          aria-label="Como instalar no iPhone"
        >
          <Share2 className="w-3.5 h-3.5 text-[#DE1F2A]" />
          <span>App no iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#DE1F2A] flex items-center justify-center text-white">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-600 bg-gray-50 p-3.5 rounded-2xl">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#DE1F2A] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <p>Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com seta para cima) na barra do Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#DE1F2A] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <p>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#DE1F2A] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <p>Toque em <strong>Adicionar</strong> no canto superior direito.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white hover:bg-black transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
