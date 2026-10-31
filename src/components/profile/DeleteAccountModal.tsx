import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Lock, ShieldAlert, Check, RefreshCw, ExternalLink } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (password: string) => Promise<void>;
  userName?: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  userName = 'Usuário',
}) => {
  const [password, setPassword] = useState('');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setHasAcknowledged(false);
      setErrorMessage(null);
      setIsDeleting(false);
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Por favor, informe sua senha de acesso para confirmar.');
      return;
    }
    if (!hasAcknowledged) {
      setErrorMessage('Marque a confirmação de que compreende o impacto da exclusão permanente.');
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await onConfirmDelete(password);
      // O logout automático e redirecionamento são acionados pelo chamador
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar exclusão. Verifique sua senha.';
      setErrorMessage(msg);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 id="delete-account-title" className="text-lg font-black text-gray-900 tracking-tight">
                Excluir Conta Permanentemente
              </h3>
              <p className="text-xs text-gray-500">
                Olá, {userName}. Esta ação removerá sua conta do Kariri.app.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Impacto */}
        <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl text-xs text-red-950 space-y-2.5">
          <p className="font-bold text-red-900 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>O que acontece ao excluir sua conta:</span>
          </p>

          <ul className="space-y-1.5 list-disc list-inside text-red-900/90 pl-1">
            <li>Seu perfil e dados de autenticação serão excluídos permanentemente;</li>
            <li>Sua lista de locais favoritados e preferências regionais serão apagadas;</li>
            <li>Sua sessão será encerrada em todos os navegadores e dispositivos;</li>
            <li>
              Eliminação de dados pessoais em conformidade com o <strong>Art. 18, VI da LGPD (Lei 13.709/2018)</strong>.
            </li>
          </ul>

          <div className="pt-1 text-[11px] text-red-800">
            <Link
              to="/privacidade"
              target="_blank"
              className="font-semibold underline inline-flex items-center gap-1 hover:text-red-950"
            >
              <span>Consulte nossa política de retenção e privacidade de dados</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-100/80 border border-red-300 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulário de Confirmação com Senha */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-bold text-gray-800 mb-1 text-xs">
              Digite sua senha atual para autorizar a exclusão: <span className="text-[#DE1F2A]">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={passwordInputRef}
                type="password"
                required
                disabled={isDeleting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha da conta"
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-red-600 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="ack-delete-account"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              disabled={isDeleting}
              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 mt-0.5 cursor-pointer"
            />
            <label
              htmlFor="ack-delete-account"
              className="text-xs text-gray-700 font-medium select-none cursor-pointer leading-tight"
            >
              Compreendo que esta ação é irreversível e que meus dados pessoais serão permanentemente eliminados.
            </label>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancelar e manter conta
            </button>
            <button
              type="submit"
              disabled={isDeleting || !password.trim() || !hasAcknowledged}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-2 active:scale-95"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Excluindo conta...</span>
                </>
              ) : (
                <span>Confirmar Exclusão Definitiva</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
