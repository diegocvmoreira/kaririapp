import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../common/LoadingState';
import { ShieldAlert } from 'lucide-react';

interface RequireAdminProps {
  children: React.ReactNode;
}

export const RequireAdmin: React.FC<RequireAdminProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <LoadingState type="spinner" message="Verificando permissões de acesso..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user.role === 'admin' && (user.status === 'active' || !user.status);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-red-100 text-[#DE1F2A] flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-gray-900">Acesso Restrito a Administradores</h2>
        <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
          Sua conta atual ({user.email}) não possui permissões administrativas para acessar esta área de gerenciamento.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <a
            href="/perfil"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition"
          >
            Voltar para o Perfil
          </a>
          <a
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition"
          >
            Ir para a Página Inicial
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
