import React from 'react';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const KabupatenMalangLogo: React.FC<LogoProps> = ({ 
  className = "w-full h-full", 
  width, 
  height 
}) => {
  return (
    <svg 
      viewBox="0 0 200 240" 
      width={width || "100%"} 
      height={height || "100%"} 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {/* Outer Shield (White Shield with Red Border) */}
      <path 
        d="M 12 12 Q 100 2 188 12 C 188 28 178 45 174 58 L 174 180 C 174 210 100 236 100 236 C 100 236 26 210 26 180 L 26 58 C 22 45 12 28 12 12 Z" 
        fill="#ffffff" 
        stroke="#d60000" 
        strokeWidth="4.5" 
        strokeLinejoin="round"
      />

      {/* Top Banner Text: KABUPATEN MALANG */}
      <text 
        x="100" 
        y="32" 
        fontFamily="'Arial Black', Arial, sans-serif" 
        fontSize="16.5" 
        fontWeight="900" 
        fill="#d60000" 
        textAnchor="middle" 
        letterSpacing="1"
      >
        KABUPATEN MALANG
      </text>

      {/* Inner Shield (Green Field with Golden Border) */}
      <g transform="translate(0, 8)">
        <path 
          d="M 33 46 Q 100 38 167 46 L 167 170 C 167 195 100 216 100 216 C 100 216 33 195 33 170 Z" 
          fill="#0e8a38" 
          stroke="#e0af1f" 
          strokeWidth="3.5" 
          strokeLinejoin="round"
        />
        
        {/* Mountain Silhouette (Gunung Semeru & Kawi) */}
        <path 
          d="M 100 66 L 148 150 L 52 150 Z" 
          fill="#075e24" 
          stroke="#033d16" 
          strokeWidth="1.5"
        />
        
        {/* Blue Sea / River Base with waves */}
        <path 
          d="M 34 140 C 55 137 75 143 100 139 C 125 135 145 141 166 138 L 166 170 C 166 195 100 216 100 216 C 100 216 34 195 34 170 Z" 
          fill="#008ecc"
        />
        
        {/* White Ripple lines on water */}
        <path d="M 40 148 Q 55 144 70 148 T 100 148 T 130 148 T 160 148" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 42 156 Q 57 152 72 156 T 100 156 T 128 156 T 158 156" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

        {/* Golden 5-pointed Star on top */}
        <polygon 
          points="100,50 106,66 122,66 109,76 114,92 100,82 86,92 91,76 78,66 94,66" 
          fill="#ffd700" 
          stroke="#cc9900" 
          strokeWidth="1.2"
        />

        {/* Rice stalk (Padi) on Left */}
        <path 
          d="M 44 168 C 36 130 46 95 86 74" 
          fill="none" 
          stroke="#ffd700" 
          strokeWidth="9" 
          strokeLinecap="round"
        />
        <path 
          d="M 44 168 C 36 130 46 95 86 74" 
          fill="none" 
          stroke="#a17400" 
          strokeWidth="2" 
          strokeDasharray="2,4"
        />

        {/* Cotton (Kapas) on Right */}
        <g fill="#ffffff" stroke="#065f24" strokeWidth="1.2">
          <circle cx="152" cy="88" r="4.5"/>
          <circle cx="156" cy="102" r="5"/>
          <circle cx="158" cy="117" r="5.5"/>
          <circle cx="157" cy="132" r="6"/>
          <circle cx="152" cy="147" r="6.5"/>
        </g>

        {/* Open Book (Buku Terbuka) */}
        <path 
          d="M 74 140 Q 100 131 100 144 Q 100 131 126 140 L 123 151 Q 100 143 100 153 Q 100 143 77 151 Z" 
          fill="#ffffff" 
          stroke="#222222" 
          strokeWidth="1.5"
        />
        {/* Book pages lines */}
        <path d="M 82 144 Q 96 139 99 146" fill="none" stroke="#666666" strokeWidth="1" />
        <path d="M 118 144 Q 104 139 101 146" fill="none" stroke="#666666" strokeWidth="1" />

        {/* Keris Standing Vertically */}
        <path 
          d="M 97.5 94 Q 102.5 94 100 120 L 100 141 L 97 141 L 97 120 Z" 
          fill="#1c1c1c" 
          stroke="#000000" 
          strokeWidth="1"
        />
        {/* Keris Handle & Warangka */}
        <path d="M 91 123 Q 100 119 109 123 L 100 132 Z" fill="#2d2d2d" stroke="#000" strokeWidth="0.8" />

        {/* Golden Chain (Rantai Emas) around bottom */}
        <path 
          d="M 66 182 C 78 196 122 196 134 182" 
          fill="none" 
          stroke="#ffd700" 
          strokeWidth="7" 
          strokeLinecap="round"
        />
        <path 
          d="M 66 182 C 78 196 122 196 134 182" 
          fill="none" 
          stroke="#855b00" 
          strokeWidth="1.5" 
          strokeDasharray="4,4"
        />

        {/* Ribbon Motto (Satata Gama Karta Raharja) */}
        <path 
          d="M 38 186 Q 100 208 162 186 L 158 198 Q 100 220 42 198 Z" 
          fill="#ffffff" 
          stroke="#222222" 
          strokeWidth="1.5"
        />
        <text 
          x="100" 
          y="199" 
          fontFamily="Arial, sans-serif" 
          fontSize="7.2" 
          fontWeight="bold" 
          fill="#111111" 
          textAnchor="middle" 
          letterSpacing="0.4"
        >
          SATATA GAMA KARTA RAHARJA
        </text>
      </g>
    </svg>
  );
};
