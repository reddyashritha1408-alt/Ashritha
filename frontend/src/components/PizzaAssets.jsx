import React from 'react';

// === CRUST ===
export const SvgCrust = ({ type }) => {
  let fill1 = '#EED29A';
  let fill2 = '#d89f53';
  let stroke = '#D4A352';
  let strokeWidth = 12;
  
  if (type === 'Thin Crust') { strokeWidth = 6; stroke = '#C4903D'; }
  else if (type === 'Cheese Burst') { strokeWidth = 16; stroke = '#f5c051'; fill2 = '#ebb854'; }
  else if (type === 'Whole Wheat') { fill1 = '#d8aa70'; fill2 = '#b57b3f'; stroke = '#986a34'; }
  else if (type === 'Gluten Free') { fill1 = '#f5dfa6'; fill2 = '#e6c875'; stroke = '#d6ad45'; }

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400">
      <defs>
        <radialGradient id={`crustGrad-${type.replace(/\s+/g, '')}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={fill1} />
          <stop offset="95%" stopColor={fill2} />
          <stop offset="100%" stopColor={stroke} />
        </radialGradient>
        <filter id="crustTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise" result="coloredNoise" />
          <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
        </filter>
        <filter id="dropShadowCrust">
          <feDropShadow dx="0" dy="15" stdDeviation="15" floodOpacity="0.4" />
        </filter>
      </defs>
      <circle cx="200" cy="200" r="190" fill={`url(#crustGrad-${type.replace(/\s+/g, '')})`} stroke={stroke} strokeWidth={strokeWidth} filter="url(#dropShadowCrust)" />
      <circle cx="200" cy="200" r="190" fill="transparent" filter="url(#crustTexture)" opacity="0.6" pointerEvents="none" />
      {type === 'Cheese Burst' && (
        <circle cx="200" cy="200" r="176" fill="transparent" stroke="#fff4d4" strokeWidth="4" opacity="0.4" filter="blur(2px)" />
      )}
    </svg>
  );
};

// === SAUCE ===
export const SvgSauce = ({ type }) => {
  let color = '#CC2900';
  let speckle = '#8B0000';
  
  if (type === 'Spicy Marinara' || type === 'Spicy') { color = '#9E1000'; speckle = '#4a0000'; }
  else if (type === 'Garlic') { color = '#FFF6E6'; speckle = '#e0cfa1'; }
  else if (type === 'BBQ Sauce' || type === 'BBQ') { color = '#4D1A00'; speckle = '#240a00'; }
  else if (type === 'Pesto') { color = '#2E5A1C'; speckle = '#122e07'; }

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <radialGradient id={`sauceGrad-${type.replace(/\s+/g, '')}`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor={color} stopOpacity="0.95" />
          <stop offset="90%" stopColor={speckle} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id="sauceTexture">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
      <circle cx="200" cy="200" r="172" fill={`url(#sauceGrad-${type.replace(/\s+/g, '')})`} filter="url(#sauceTexture)" />
    </svg>
  );
};

// === CHEESE ===
export const SvgCheese = ({ type }) => {
  let color1 = '#FFEA99'; let color2 = '#FFD54F';
  if (type === 'Cheddar') { color1 = '#FFB300'; color2 = '#F57C00'; }
  else if (type === 'Parmesan') { color1 = '#FFF3CC'; color2 = '#FFE082'; }
  else if (type === 'Vegan Cheese' || type === 'Vegan') { color1 = '#E6D5B8'; color2 = '#D7CCC8'; }

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 400" style={{ position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <filter id="cheeseMelt">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" in="noise" result="coloredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="coloredNoise" scale="15" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <radialGradient id={`cheeseGrad-${type.replace(/\s+/g, '')}`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor={color1} stopOpacity="0.95" />
          <stop offset="95%" stopColor={color2} stopOpacity="0.85" />
          <stop offset="100%" stopColor={color1} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="162" fill={`url(#cheeseGrad-${type.replace(/\s+/g, '')})`} filter="url(#cheeseMelt)" />
      {/* Baked spots */}
      <circle cx="150" cy="120" r="15" fill="#d89f53" opacity="0.4" style={{ filter: 'blur(4px)' }} />
      <circle cx="250" cy="280" r="25" fill="#d89f53" opacity="0.3" style={{ filter: 'blur(6px)' }} />
      <circle cx="100" cy="220" r="18" fill="#d89f53" opacity="0.5" style={{ filter: 'blur(5px)' }} />
      <circle cx="280" cy="150" r="20" fill="#d89f53" opacity="0.3" style={{ filter: 'blur(5px)' }} />
    </svg>
  );
};

// === TOPPINGS ===

export const SvgOnion = () => (
  <svg width="30" height="30" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="16" fill="transparent" stroke="rgba(230,210,255,0.7)" strokeWidth="3" />
    <circle cx="20" cy="20" r="12" fill="transparent" stroke="rgba(230,210,255,0.9)" strokeWidth="2" />
    <circle cx="20" cy="20" r="8" fill="transparent" stroke="rgba(230,210,255,0.6)" strokeWidth="1.5" />
  </svg>
);

export const SvgCapsicum = () => (
  <svg width="24" height="24" viewBox="0 0 30 30">
    <path d="M5,10 Q15,0 25,10 Q28,20 20,25 Q15,15 10,25 Q2,20 5,10 Z" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1" />
    <path d="M8,12 Q15,5 22,12" fill="transparent" stroke="#4CAF50" strokeWidth="1.5" opacity="0.6" />
  </svg>
);

export const SvgTomato = () => (
  <svg width="34" height="34" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#D32F2F" />
    <circle cx="20" cy="20" r="14" fill="#C62828" />
    <path d="M12,12 Q20,5 28,12 Q25,20 28,28 Q20,35 12,28 Q15,20 12,12 Z" fill="#B71C1C" opacity="0.6" />
    <circle cx="16" cy="14" r="1.5" fill="#FFCDD2" />
    <circle cx="24" cy="14" r="1.5" fill="#FFCDD2" />
    <circle cx="16" cy="26" r="1.5" fill="#FFCDD2" />
    <circle cx="24" cy="26" r="1.5" fill="#FFCDD2" />
    <circle cx="12" cy="20" r="1.5" fill="#FFCDD2" />
    <circle cx="28" cy="20" r="1.5" fill="#FFCDD2" />
  </svg>
);

export const SvgMushroom = () => (
  <svg width="26" height="26" viewBox="0 0 30 30">
    <path d="M15,2 C22,2 28,8 28,15 C28,18 25,20 20,20 L20,28 L10,28 L10,20 C5,20 2,18 2,15 C2,8 8,2 15,2 Z" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="1.5" />
    <path d="M15,4 C19,4 23,7 25,12" fill="transparent" stroke="#BCAAA4" strokeWidth="1" />
    <path d="M10,20 L15,10 L20,20" fill="transparent" stroke="#8D6E63" strokeWidth="1.5" opacity="0.4" />
  </svg>
);

export const SvgOlive = () => (
  <svg width="18" height="18" viewBox="0 0 20 20">
    <circle cx="10" cy="10" r="8" fill="transparent" stroke="#212121" strokeWidth="4" />
    <circle cx="7" cy="7" r="1" fill="#fff" opacity="0.5" />
  </svg>
);

export const SvgJalapeno = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#81C784" stroke="#1B5E20" strokeWidth="2.5" />
    <circle cx="12" cy="12" r="5" fill="transparent" stroke="#388E3C" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" fill="#E8F5E9" />
  </svg>
);

export const SvgCorn = () => (
  <svg width="14" height="14" viewBox="0 0 16 16">
    <path d="M4,12 C2,8 4,2 8,2 C12,2 14,8 12,12 C10,16 6,16 4,12 Z" fill="#FBC02D" />
    <path d="M6,4 Q8,2 10,4" fill="transparent" stroke="#FFF" strokeWidth="1" opacity="0.6" />
    <circle cx="8" cy="12" r="1.5" fill="#F57F17" />
  </svg>
);

export const SvgPaneer = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#FFF9C4" stroke="#FBC02D" strokeWidth="1.5" />
    <path d="M5,5 L10,10 M15,5 L20,10 M5,15 L10,20" stroke="#F57F17" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
  </svg>
);

export const SvgPepperoni = () => (
  <svg width="34" height="34" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="18" fill="#B71C1C" stroke="#7F0000" strokeWidth="1" />
    <circle cx="12" cy="15" r="2" fill="#FFCDD2" opacity="0.6" />
    <circle cx="25" cy="12" r="2.5" fill="#FFCDD2" opacity="0.5" />
    <circle cx="18" cy="25" r="1.5" fill="#FFCDD2" opacity="0.7" />
    <circle cx="28" cy="22" r="2" fill="#FFCDD2" opacity="0.5" />
    <circle cx="10" cy="22" r="1.5" fill="#FFCDD2" opacity="0.6" />
    <path d="M8,20 A12,12 0 0,1 20,8" fill="transparent" stroke="#fff" strokeWidth="2" opacity="0.2" strokeLinecap="round" />
  </svg>
);

export const SvgChicken = () => (
  <svg width="28" height="28" viewBox="0 0 30 30">
    <path d="M8,5 C15,2 25,5 26,12 C28,18 20,25 12,26 C5,28 2,20 4,12 C5,8 5,6 8,5 Z" fill="#D7CCC8" stroke="#8D6E63" strokeWidth="1" />
    <line x1="8" y1="8" x2="22" y2="22" stroke="#5D4037" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
    <line x1="12" y1="6" x2="26" y2="20" stroke="#5D4037" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
    <line x1="4" y1="10" x2="18" y2="24" stroke="#5D4037" strokeWidth="2.5" opacity="0.7" strokeLinecap="round" />
  </svg>
);

export const SvgSausage = () => (
  <svg width="24" height="24" viewBox="0 0 28 28">
    <path d="M6,8 C10,2 20,4 22,10 C25,18 18,25 10,22 C4,20 2,15 6,8 Z" fill="#5D4037" stroke="#3E2723" strokeWidth="1" />
    <circle cx="12" cy="12" r="1" fill="#D7CCC8" opacity="0.5" />
    <circle cx="18" cy="15" r="1.5" fill="#D7CCC8" opacity="0.4" />
    <circle cx="10" cy="18" r="1" fill="#D7CCC8" opacity="0.6" />
  </svg>
);

export const SvgBacon = () => (
  <svg width="34" height="18" viewBox="0 0 40 20">
    <path d="M2,10 Q10,0 20,10 T38,10" fill="transparent" stroke="#5D4037" strokeWidth="6" strokeLinecap="round" />
    <path d="M2,10 Q10,0 20,10 T38,10" fill="transparent" stroke="#A1887F" strokeWidth="2" opacity="0.8" strokeLinecap="round" />
  </svg>
);

export const SvgDefault = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path d="M4,12 C4,5 12,2 20,4 C22,12 18,20 12,20 C5,20 4,18 4,12 Z" fill="#81C784" stroke="#388E3C" strokeWidth="1.5" />
  </svg>
);
