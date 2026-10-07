import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  fallbackTo?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Voltar',
  fallbackTo = '/',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackTo);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:text-black hover:bg-gray-50 active:scale-95 transition shadow-2xs ${className}`}
      aria-label="Voltar à página anterior"
    >
      <ArrowLeft className="w-4 h-4 text-gray-600" />
      {label && <span>{label}</span>}
    </button>
  );
};
