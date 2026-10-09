import React from 'react';

interface LoadingStateProps {
  message?: string;
  count?: number;
  type?: 'card' | 'inline' | 'spinner';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando experiências...',
  count = 3,
  type = 'card',
}) => {
  if (type === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#DE1F2A] rounded-full animate-spin"></div>
        {message && <p className="mt-3 text-xs text-gray-500 font-medium">{message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-3">
          <div className="w-24 h-24 bg-gray-200 rounded-xl shrink-0"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
