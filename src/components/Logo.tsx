
import React from 'react';

// URL do Logo no Supabase Bucket
const LOGO_URL = 'https://vfryefavzurwoiuznkwv.supabase.co/storage/v1/object/public/site-assets/logo.png';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
  height?: number;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'full', height = 40, onClick }) => {
  return (
    <div 
      className={`logo-container ${className}`} 
      onClick={onClick} 
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onClick ? 'pointer' : 'default', height }}
    >
      <img 
        src={LOGO_URL} 
        alt="PetSpa Logo" 
        style={{ 
            height: height, 
            width: 'auto', 
            objectFit: 'contain',
            filter: variant === 'white' ? 'brightness(0) invert(1)' : 'none'
        }}
        onError={(e) => {
            // Fallback simples caso a imagem não carregue
            e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
