/**
 * 和のデザインのヒーローに出るエンブレム: 墨のかすれた筆で描いた、梅の枝。
 * 根元は墨がかすれて消え、枝は幹から枝先へ描かれ、朱の五弁の花は、花びらが回りながら開く。
 * 枝の線は pathLength=1 の dash で描かれ、動きは styles/wa.css が決める。
 * 通常・Pop のデザインでは描画しない（Hero.tsx が出し分ける）。
 */
import type { CSSProperties } from "react";

// 枝: [path, 線の太さ, 描き始めるまでの秒数]。幹から枝先へ、太さを細くしながら順に描く
const BRANCHES: [string, number, number][] = [
  ["M60 432 C80 382 96 352 130 322", 22, 0],
  ["M130 322 L176 300 C200 290 214 268 222 240", 16, 0.3],
  ["M222 240 C232 204 256 186 290 170", 11, 0.55],
  ["M290 170 L318 128 C326 110 336 96 356 82", 6.5, 0.8],
  ["M356 82 C366 74 374 64 382 48", 3, 1.0],
  ["M176 300 C150 270 150 230 166 196", 8, 0.5],
  ["M166 196 L150 160 C146 146 150 130 160 118", 4.5, 0.8],
  ["M160 118 C164 104 172 96 184 88", 2, 1.0],
  ["M290 170 C320 176 346 196 360 226", 6, 0.75],
  ["M360 226 L386 250", 2.6, 1.0],
  ["M222 240 C250 252 268 272 274 302", 4, 0.7],
];

// 花: [x, y, 回転（度）, 大きさ, 咲き始めるまでの秒数]
const BLOSSOMS: [number, number, number, number, number][] = [
  [228, 232, 10, 1.18, 1.3],
  [182, 292, -20, 0.93, 1.4],
  [300, 160, 15, 0.96, 1.6],
  [326, 120, 0, 0.71, 1.8],
  [362, 80, 30, 0.62, 2.0],
  [160, 190, -10, 0.84, 1.7],
  [152, 128, 20, 0.65, 1.9],
  [352, 212, 0, 0.81, 1.8],
  [274, 298, 25, 0.65, 2.0],
  [120, 330, 5, 0.62, 1.6],
];

// つぼみ: [cx, cy, 半径, 開き始めるまでの秒数]
const BUDS: [number, number, number, number][] = [
  [386, 44, 3.8, 2.3],
  [188, 86, 3.4, 2.2],
  [388, 252, 3.2, 2.3],
  [338, 104, 3, 2.1],
  [268, 190, 3, 2.0],
  [278, 312, 3, 2.3],
];

// 五弁: 花びら1枚は、中心から (0, -7) にある円。72度ずつ回して5枚にする
const PETAL_ANGLES = [0, 72, 144, 216, 288];

// CSS のカスタムプロパティ（--d: 咲き始めの秒数、--i: 花びらの順番）を、style で渡す
const vars = (values: Record<string, string | number>) => values as CSSProperties;

export default function Emblem() {
  return (
    <div className="emblem" aria-hidden="true">
      <svg viewBox="0 0 400 440">
        <defs>
          {/* 筆のゆらぎと、墨のかすれ（縦に細かい筋）を付ける */}
          <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="4.5" result="d" />
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves="2" seed="11" result="k" />
            <feColorMatrix in="k" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -5 3.9" result="km" />
            <feComposite in="d" in2="km" operator="in" />
          </filter>
          {/* 枝の根元（左下）が、ページの地に溶けるように消える */}
          <linearGradient id="fb" gradientUnits="userSpaceOnUse" x1="52" y1="440" x2="118" y2="336">
            <stop offset="0" stopColor="#000" />
            <stop offset=".25" stopColor="#555" />
            <stop offset="1" stopColor="#fff" />
          </linearGradient>
          <mask id="fadeBase" maskUnits="userSpaceOnUse" x="-20" y="-20" width="440" height="480">
            <rect x="-20" y="-20" width="440" height="480" fill="url(#fb)" />
          </mask>
          <filter id="wash" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
        </defs>
        {/* 枝の後ろの、薄い墨の滲み */}
        <path
          className="wash"
          d="M40 420 C90 330 170 270 250 200 C310 150 360 90 400 30 L410 60 C370 130 320 190 260 240 C190 300 120 360 80 440Z"
          fill="#1D1C1A"
          opacity=".09"
          filter="url(#wash)"
        />
        <g mask="url(#fadeBase)">
          <g filter="url(#ink)" fill="none" stroke="#1D1C1A" strokeLinecap="round">
            {BRANCHES.map(([d, width, wait]) => (
              <path key={d} className="br" pathLength={1} d={d} strokeWidth={width} style={{ animationDelay: `${wait}s` }} />
            ))}
          </g>
        </g>
        {BLOSSOMS.map(([x, y, angle, scale, wait]) => (
          <g key={`${x}-${y}`} className="bl" style={vars({ "--d": `${wait}s` })} transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
            <g className="pts" fill="#B4362A">
              {PETAL_ANGLES.map((petalAngle, i) => (
                <g key={petalAngle} transform={`rotate(${petalAngle})`}>
                  <circle className="pt" style={vars({ "--i": i })} cy={-7} r={6.6} />
                </g>
              ))}
            </g>
            <circle className="ctr" r={2.6} fill="#D8B46A" />
          </g>
        ))}
        {BUDS.map(([cx, cy, r, wait]) => (
          <circle key={`${cx}-${cy}`} className="fl" style={{ animationDelay: `${wait}s` }} cx={cx} cy={cy} r={r} fill="#B4362A" />
        ))}
      </svg>
    </div>
  );
}
