import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 380 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ContaEs Logo"
    >
      <defs>
        <linearGradient id="logo-gradient-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0085ca"/>
          <stop offset="100%" stopColor="#005a8a"/>
        </linearGradient>
        <filter id="drop-shadow" x="-0.3" y="-0.3" width="1.6" height="1.6">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
            <feOffset dx="3" dy="3" result="offsetblur"/>
            <feFlood floodColor="#000000" floodOpacity="0.2"/>
            <feComposite in2="offsetblur" operator="in"/>
            <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>

      {/* Icon part */}
      <g filter="url(#drop-shadow)">
          {/* Base Shape - like a coin */}
          <circle cx="45" cy="45" r="45" fill="url(#logo-gradient-blue)"/>
          
          {/* Graph bars inside */}
          <rect x="25" y="50" width="12" height="20" rx="3" fill="white" fillOpacity="0.8"/>
          <rect x="43" y="40" width="12" height="30" rx="3" fill="white" fillOpacity="0.9"/>
          
          {/* Arrow on top */}
          <path d="M58 45 L58 20 L75 32.5 Z" fill="white"/>
          <rect x="54" y="30" width="8" height="30" rx="3" fill="white"/>
      </g>
      
      {/* Text part */}
      <text
        x="110"
        y="65"
        fontFamily="Inter, sans-serif"
        fontSize="60"
        fontWeight="800"
        letterSpacing="-0.04em"
      >
        <tspan fill="#005a8a">Conta</tspan>
        <tspan fill="#25a9e0">Es</tspan>
      </text>
    </svg>
  );
};

export default Logo;
