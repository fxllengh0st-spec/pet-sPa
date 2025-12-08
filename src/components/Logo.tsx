
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'white';
  height?: number;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'full', height = 40, onClick }) => {
  const isWhite = variant === 'white';
  const primaryColor = isWhite ? '#FFFFFF' : '#FF8C42';
  const secondaryColor = isWhite ? 'rgba(255,255,255,0.8)' : '#2D3436';

  return (
    <div 
      className={`logo-container ${className}`} 
      onClick={onClick} 
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: onClick ? 'pointer' : 'default', height }}
    >
      <svg
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Main Paw Pad - Heart Shaped for Care */}
        <path
          d="M50 85C65 85 75 75 75 60C75 48 65 38 50 38C35 38 25 48 25 60C25 75 35 85 50 85Z"
          fill={primaryColor}
        />
        
        {/* Toes as Bubbles/Droplets for Spa Theme */}
        <circle cx="20" cy="45" r="12" fill={primaryColor} opacity="0.8" />
        <circle cx="40" cy="25" r="14" fill={primaryColor} opacity="0.9" />
        <circle cx="65" cy="25" r="14" fill={primaryColor} opacity="0.9" />
        <circle cx="85" cy="45" r="12" fill={primaryColor} opacity="0.8" />

        {/* Shine effect on main pad */}
        <path d="M40 50C40 50 45 45 55 48" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.4"/>
        
        {/* Floating Spa Bubbles */}
        <circle cx="85" cy="15" r="5" fill={primaryColor} opacity="0.4" />
        <circle cx="15" cy="15" r="4" fill={primaryColor} opacity="0.3" />
      </svg>

      {variant !== 'icon' && (
        <span style={{ 
            fontFamily: "'Quicksand', sans-serif", 
            fontWeight: 800, 
            fontSize: height * 0.7, 
            color: secondaryColor,
            lineHeight: 1,
            letterSpacing: '-0.03em'
        }}>
          PetSpa
        </span>
      )}
    </div>
  );
};
