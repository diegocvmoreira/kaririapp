import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { setPageMeta } from '../utils/seo';

export const NotFoundPage: React.FC = () => {
  React.useEffect(() => {
    setPageMeta({
      title: 'Página não encontrada',
      description: 'A página que você tentou acessar não existe no Kariri.app.',
    });
  }, []);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-[#FDE8E9] text-[#DE1F2A] flex items-center justify-center">
          <SearchX className="w-8 h-8" aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-[#DE1F2A]">Erro 404</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">Página não encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          O endereço pode estar incorreto ou o conteúdo foi removido.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#DE1F2A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#C51620]"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
};
