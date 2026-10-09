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
        <p className="text-xs text-gray-500 leading-relaxed">
          Sua conta atual não possui permissões administrativas ativas para gerenciar a plataforma.
        </p>
        <Navigate to="/perfil" replace />
      </div>
    );
  }

  return <>{children}</>;
};
