import React, { useState } from 'react';
import { Place } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { businessClaimsApi } from '../../services/api/businessClaims';
import { X, Building2, CheckCircle2 } from 'lucide-react';

interface BusinessClaimModalProps {
  place: Place;
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessClaimModal: React.FC<BusinessClaimModalProps> = ({
  place,
  isOpen,
  onClose,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Preencha os campos obrigatórios para enviar a solicitação.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await businessClaimsApi.createClaim({
        user_id: user?.id || 999,
        user_name: name,
        user_email: email,
        place_id: place.id,
        place_name: place.name,
        phone,
        message,
        proof,
      });
      setIsSuccess(true);
    } catch {
      setErrorMsg('Falha ao enviar reivindicação. Tente novamente mais tarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FDE8E9] flex items-center justify-center text-[#DE1F2A]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Reivindicar este Estabelecimento
              </h3>
              <p className="text-[11px] text-gray-500">
                {place.name} • {place.city_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Solicitação Enviada!</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Recebemos sua solicitação para <strong>{place.name}</strong>. Nossa equipe
                analisará as informações e entrará em contato em até 48 horas úteis.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black transition"
              >
                Concluir
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-2xl">
                Você é o proprietário ou gestor oficial do <strong>{place.name}</strong>?
                Envie suas informações para gerenciar horários, contatos e fotos oficiais no Kariri.app.
              </p>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-[#DE1F2A] text-xs font-semibold rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do gestor ou proprietário"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    E-mail de Contato *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@comercial.com"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(88) 99999-9999"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Vínculo com o Estabelecimento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: Sou fundador e administrador do local..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Comprovação ou CNPJ (Opcional)
                </label>
                <input
                  type="text"
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="CNPJ, link do Instagram comercial ou site oficial"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#DE1F2A] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#DE1F2A] text-white font-bold hover:bg-[#C51620] active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
