/**
 * Lambang Kabupaten Malang Vector SVG & Base64 Data URL
 */
const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="200" height="240">
  <path d="M 12 12 Q 100 2 188 12 C 188 28 178 45 174 58 L 174 180 C 174 210 100 236 100 236 C 100 236 26 210 26 180 L 26 58 C 22 45 12 28 12 12 Z" fill="#ffffff" stroke="#d60000" stroke-width="4.5" stroke-linejoin="round"/>
  <text x="100" y="32" font-family="'Arial Black', Arial, sans-serif" font-size="16.5" font-weight="900" fill="#d60000" text-anchor="middle" letter-spacing="1">KABUPATEN MALANG</text>
  <g transform="translate(0, 8)">
    <path d="M 33 46 Q 100 38 167 46 L 167 170 C 167 195 100 216 100 216 C 100 216 33 195 33 170 Z" fill="#0e8a38" stroke="#e0af1f" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M 100 66 L 148 150 L 52 150 Z" fill="#075e24" stroke="#033d16" stroke-width="1.5"/>
    <path d="M 34 140 C 55 137 75 143 100 139 C 125 135 145 141 166 138 L 166 170 C 166 195 100 216 100 216 C 100 216 34 195 34 170 Z" fill="#008ecc"/>
    <path d="M 40 148 Q 55 144 70 148 T 100 148 T 130 148 T 160 148" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M 42 156 Q 57 152 72 156 T 100 156 T 128 156 T 158 156" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>
    <polygon points="100,50 106,66 122,66 109,76 114,92 100,82 86,92 91,76 78,66 94,66" fill="#ffd700" stroke="#cc9900" stroke-width="1.2"/>
    <path d="M 44 168 C 36 130 46 95 86 74" fill="none" stroke="#ffd700" stroke-width="9" stroke-linecap="round"/>
    <path d="M 44 168 C 36 130 46 95 86 74" fill="none" stroke="#a17400" stroke-width="2" stroke-dasharray="2,4"/>
    <g fill="#ffffff" stroke="#065f24" stroke-width="1.2">
      <circle cx="152" cy="88" r="4.5"/>
      <circle cx="156" cy="102" r="5"/>
      <circle cx="158" cy="117" r="5.5"/>
      <circle cx="157" cy="132" r="6"/>
      <circle cx="152" cy="147" r="6.5"/>
    </g>
    <path d="M 74 140 Q 100 131 100 144 Q 100 131 126 140 L 123 151 Q 100 143 100 153 Q 100 143 77 151 Z" fill="#ffffff" stroke="#222222" stroke-width="1.5"/>
    <path d="M 97.5 94 Q 102.5 94 100 120 L 100 141 L 97 141 L 97 120 Z" fill="#1c1c1c" stroke="#000000" stroke-width="1"/>
    <path d="M 91 123 Q 100 119 109 123 L 100 132 Z" fill="#2d2d2d" stroke="#000" strokeWidth="0.8"/>
    <path d="M 66 182 C 78 196 122 196 134 182" fill="none" stroke="#ffd700" stroke-width="7" stroke-linecap="round"/>
    <path d="M 66 182 C 78 196 122 196 134 182" fill="none" stroke="#855b00" stroke-width="1.5" stroke-dasharray="4,4"/>
    <path d="M 38 186 Q 100 208 162 186 L 158 198 Q 100 220 42 198 Z" fill="#ffffff" stroke="#222222" stroke-width="1.5"/>
    <text x="100" y="199" font-family="Arial, sans-serif" font-size="7.2" font-weight="bold" fill="#111111" text-anchor="middle" letter-spacing="0.4">SATATA GAMA KARTA RAHARJA</text>
  </g>
</svg>`;

export const LOGO_MALANG_SVG = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(rawSvg) : Buffer.from(rawSvg).toString('base64')}`;
