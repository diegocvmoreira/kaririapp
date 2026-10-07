import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  size = 'md',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url || window.location.href;
    const shareData = {
      title,
      text: text || title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Compartilhar"
        className={`rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-700 hover:text-black hover:bg-gray-50 active:scale-90 transition shadow-2xs ${sizeClasses[size]} ${className}`}
      >
        {copied ? (
          <Check className={`${iconSizes[size]} text-emerald-600`} />
        ) : (
          <Share2 className={iconSizes[size]} />
        )}
      </button>

      {copied && (
        <span className="absolute -bottom-7 right-0 text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-md whitespace-nowrap shadow-md z-30 animate-in fade-in">
          Link copiado!
        </span>
      )}
    </div>
  );
};
