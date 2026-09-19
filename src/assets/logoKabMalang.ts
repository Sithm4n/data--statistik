/**
 * High-definition SVG of Lambang Kabupaten Malang
 * Authentic colors and heraldic elements:
 * - Shield red border and white crown contour
 * - Green mountain & sky background
 * - Yellow star & rice ear (padi)
 * - White cotton (kapas)
 * - Keris & open book
 * - Blue waves (sungai/laut) & golden chain (rantai emas)
 * - Ribbon with motto "SATATA GAMA KARTA RAHARJA"
 * - Banner header "KABUPATEN MALANG"
 */
export const LOGO_MALANG_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="100%" height="100%">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.15"/>
    </filter>
  </defs>

  <!-- Outer Shield Contour (Red Rim) -->
  <path d="M 12 12 Q 100 2 188 12 C 188 28 178 45 174 58 L 174 180 C 174 210 100 236 100 236 C 100 236 26 210 26 180 L 26 58 C 22 45 12 28 12 12 Z" 
        fill="#ffffff" stroke="#d60000" stroke-width="4.5" stroke-linejoin="round"/>

  <!-- Top Banner: KABUPATEN MALANG -->
  <text x="100" y="32" font-family="'Arial Black', Arial, sans-serif" font-size="16.5" font-weight="900" fill="#d60000" text-anchor="middle" letter-spacing="1">KABUPATEN MALANG</text>

  <!-- Inner Shield (Gold Frame + Green Field) -->
  <g transform="translate(0, 8)">
    <path d="M 33 46 Q 100 38 167 46 L 167 170 C 167 195 100 216 100 216 C 100 216 33 195 33 170 Z" 
          fill="#118838" stroke="#d4af37" stroke-width="3" stroke-linejoin="round"/>
    
    <!-- Mountain Contour (Gunung Semeru / Kawi) -->
    <path d="M 100 70 L 148 152 L 52 152 Z" fill="#0c6b2b" stroke="#004d1a" stroke-width="1.5"/>
    
    <!-- Blue Sea / River Base with waves -->
    <path d="M 34 140 C 55 137 75 143 100 139 C 125 135 145 141 166 138 L 166 170 C 166 195 100 216 100 216 C 100 216 34 195 34 170 Z" 
          fill="#0088cc"/>
    
    <!-- White Ripple lines on water -->
    <path d="M 40 148 Q 55 144 70 148 T 100 148 T 130 148 T 160 148" fill="none" stroke="#ffffff" stroke-width="2"/>
    <path d="M 42 155 Q 57 151 72 155 T 100 155 T 128 155 T 158 155" fill="none" stroke="#ffffff" stroke-width="2"/>

    <!-- Golden Star on Top of Mountain -->
    <polygon points="100,53 105,67 119,67 108,76 112,90 100,81 88,90 92,76 81,67 95,67" 
             fill="#ffd700" stroke="#cc9900" stroke-width="1.2"/>

    <!-- Rice (Padi) on Left -->
    <path d="M 42 165 C 36 130 45 95 85 75" fill="none" stroke="#ffd700" stroke-width="8" stroke-linecap="round"/>
    <path d="M 42 165 C 36 130 45 95 85 75" fill="none" stroke="#b8860b" stroke-width="2" stroke-dasharray="2,5"/>

    <!-- Cotton (Kapas) on Right -->
    <g fill="#ffffff" stroke="#006622" stroke-width="1">
      <circle cx="152" cy="90" r="4.5"/>
      <circle cx="156" cy="103" r="5"/>
      <circle cx="158" cy="118" r="5.5"/>
      <circle cx="157" cy="133" r="6"/>
      <circle cx="152" cy="148" r="6.5"/>
    </g>

    <!-- Open Book (Kitab Suci / Ilmu Pengetahuan) -->
    <path d="M 75 142 Q 100 134 100 145 Q 100 134 125 142 L 122 152 Q 100 145 100 154 Q 100 145 78 152 Z" 
          fill="#ffffff" stroke="#333333" stroke-width="1.5"/>

    <!-- Keris in center -->
    <path d="M 98 96 Q 102 96 100 120 L 100 142 L 97 142 L 97 120 Z" fill="#222222" stroke="#111111" stroke-width="1"/>
    <!-- Keris Handle & Guard -->
    <path d="M 92 126 Q 100 122 108 126 L 100 134 Z" fill="#1a1a1a"/>

    <!-- Golden Chain (Rantai Emas) around lower crest -->
    <path d="M 68 184 C 80 196 120 196 132 184" fill="none" stroke="#ffd700" stroke-width="6" stroke-linecap="round"/>
    <path d="M 68 184 C 80 196 120 196 132 184" fill="none" stroke="#333333" stroke-width="1.5" stroke-dasharray="4,4"/>

    <!-- Motto Ribbon (Satata Gama Karta Raharja) -->
    <path d="M 40 188 Q 100 210 160 188 L 156 198 Q 100 220 44 198 Z" 
          fill="#ffffff" stroke="#333333" stroke-width="1.5"/>
    <text x="100" y="200" font-family="Arial, sans-serif" font-size="7" font-weight="bold" fill="#111111" text-anchor="middle" letter-spacing="0.5">SATATA GAMA KARTA RAHARJA</text>
  </g>
</svg>`;
