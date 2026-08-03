import type { GameId } from '../games/types';

function ArtworkContent({ gameId }: { gameId: GameId }) {
  switch (gameId) {
    case 'tap-panic':
      return (
        <>
          <circle cx="190" cy="112" r="54" fill="currentColor" />
          <circle cx="430" cy="270" r="82" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="610" cy="115" r="28" fill="currentColor" />
          <circle cx="690" cy="350" r="44" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M348 62v92M302 108h92" stroke="currentColor" strokeWidth="3" />
        </>
      );
    case 'quick-math':
      return (
        <>
          <text x="70" y="180" fontSize="122" fontFamily="var(--font-pixel)">12</text>
          <text x="290" y="180" fontSize="96" fontFamily="var(--font-mono)">×</text>
          <text x="470" y="180" fontSize="122" fontFamily="var(--font-pixel)">4</text>
          <line x1="70" y1="245" x2="730" y2="245" stroke="currentColor" strokeWidth="3" />
          <text x="70" y="380" fontSize="112" fontFamily="var(--font-pixel)">48</text>
          <circle cx="678" cy="338" r="56" fill="currentColor" />
          <path d="m651 338 18 18 36-42" fill="none" stroke="var(--color-paper)" strokeWidth="8" />
        </>
      );
    case 'simon':
      return (
        <>
          <rect x="90" y="55" width="260" height="165" fill="currentColor" />
          <rect x="450" y="55" width="260" height="165" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect x="90" y="280" width="260" height="165" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect x="450" y="280" width="260" height="165" fill="currentColor" />
        </>
      );
    case 'missing-number':
      return (
        <>
          <text x="45" y="290" fontSize="112" fontFamily="var(--font-pixel)">2</text>
          <text x="230" y="290" fontSize="112" fontFamily="var(--font-pixel)">4</text>
          <rect x="404" y="170" width="132" height="140" fill="currentColor" />
          <text x="435" y="278" fontSize="92" fill="var(--color-paper)" fontFamily="var(--font-pixel)">?</text>
          <text x="635" y="290" fontSize="112" fontFamily="var(--font-pixel)">8</text>
          <path d="M105 350h590" stroke="currentColor" strokeWidth="3" strokeDasharray="10 12" />
        </>
      );
    case 'word-scramble':
      return (
        <>
          {['A', 'C', 'A', 'K'].map((letter, index) => (
            <g key={`${letter}-${index}`} transform={`translate(${85 + index * 175} ${105 + (index % 2) * 70}) rotate(${index % 2 ? 5 : -5})`}>
              <rect width="132" height="154" fill={index === 2 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="3" />
              <text x="66" y="105" textAnchor="middle" fontSize="74" fill={index === 2 ? 'var(--color-paper)' : 'currentColor'} fontFamily="var(--font-pixel)">{letter}</text>
            </g>
          ))}
          <path d="M104 397h590" stroke="currentColor" strokeWidth="3" />
        </>
      );
    case 'bubble-sniper':
      return (
        <>
          <circle cx="400" cy="250" r="105" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="400" cy="250" r="55" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="176" cy="120" r="46" fill="currentColor" />
          <circle cx="658" cy="380" r="72" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="630" cy="90" r="25" fill="currentColor" />
          <path d="M400 65v370M215 250h370" stroke="currentColor" strokeWidth="2" />
        </>
      );
    case 'dodge':
      return (
        <>
          <path d="M70 430h660" stroke="currentColor" strokeWidth="3" />
          <rect x="110" y="44" width="100" height="208" fill="currentColor" />
          <rect x="335" y="85" width="100" height="160" fill="none" stroke="currentColor" strokeWidth="3" />
          <rect x="590" y="22" width="100" height="235" fill="currentColor" />
          <circle cx="400" cy="383" r="44" fill="currentColor" />
          <path d="m328 382-48-30m192 30 48-30" stroke="currentColor" strokeWidth="3" />
        </>
      );
    case 'beat-tap':
      return (
        <>
          <circle cx="400" cy="250" r="168" fill="none" stroke="currentColor" strokeWidth="3" />
          <circle cx="400" cy="250" r="112" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="12 16" />
          <circle cx="400" cy="250" r="54" fill="currentColor" />
          <path d="M145 120v170c0 37-28 65-65 65M655 95v170c0 37 28 65 65 65" fill="none" stroke="currentColor" strokeWidth="10" />
          <circle cx="80" cy="355" r="28" fill="currentColor" />
          <circle cx="720" cy="330" r="28" fill="currentColor" />
        </>
      );
    case 'arena-fps':
      return (
        <>
          <path d="M70 440 310 250 70 55M730 440 490 250 730 55M70 250h660" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M400 42v416M190 140l420 220M610 140 190 360" stroke="currentColor" strokeWidth="2" />
          <circle cx="400" cy="250" r="58" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M400 160v45M400 295v45M310 250h45M445 250h45" stroke="currentColor" strokeWidth="4" />
          <rect x="115" y="95" width="75" height="108" fill="currentColor" />
          <rect x="625" y="302" width="65" height="92" fill="currentColor" />
        </>
      );
  }
}

export function GameArtwork({ gameId, label }: { gameId: GameId; label: string }) {
  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label={label}
      className="block size-full bg-paper text-ink"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x="1.5" y="1.5" width="797" height="497" fill="none" stroke="currentColor" strokeWidth="3" />
      <ArtworkContent gameId={gameId} />
    </svg>
  );
}
