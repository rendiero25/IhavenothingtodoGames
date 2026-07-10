export type Expression = 'happy' | 'yawn' | 'sleep' | 'shock' | 'hype';

export function Mascot({ expression = 'happy', size = 120 }: { expression?: Expression; size?: number }) {
  const eyes = () => {
    switch (expression) {
      case 'sleep':
        return (
          <>
            <path d="M18 30 q4 3 8 0" className="stroke-ink" strokeWidth={3} fill="none" strokeLinecap="round" />
            <path d="M38 30 q4 3 8 0" className="stroke-ink" strokeWidth={3} fill="none" strokeLinecap="round" />
          </>
        );
      case 'shock':
        return (
          <>
            <circle cx={22} cy={30} r={6} className="fill-ink" />
            <circle cx={42} cy={30} r={6} className="fill-ink" />
            <circle cx={24} cy={28} r={2} fill="#FFF4E4" />
            <circle cx={44} cy={28} r={2} fill="#FFF4E4" />
          </>
        );
      case 'hype':
        return (
          <>
            <path d="M17 30 l5 -5 l5 5" className="stroke-ink" strokeWidth={3.5} fill="none" strokeLinecap="round" />
            <path d="M37 30 l5 -5 l5 5" className="stroke-ink" strokeWidth={3.5} fill="none" strokeLinecap="round" />
          </>
        );
      default:
        return (
          <>
            <circle cx={22} cy={30} r={4} className="fill-ink" />
            <circle cx={42} cy={30} r={4} className="fill-ink" />
          </>
        );
    }
  };

  const mouth = () => {
    switch (expression) {
      case 'yawn':
      case 'shock':
        return <ellipse cx={32} cy={43} rx={6} ry={8} className="fill-ink" />;
      case 'sleep':
        return <ellipse cx={32} cy={44} rx={4} ry={3} className="fill-ink" />;
      case 'hype':
        return <path d="M24 41 q8 9 16 0 z" className="fill-ink" />;
      default:
        return <path d="M25 42 q7 6 14 0" className="stroke-ink" strokeWidth={3} fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 5C15 5 5 19 5 34c0 17 13 25 27 25s27-8 27-25C59 19 49 5 32 5Z"
        className="fill-coral stroke-ink"
        strokeWidth={3}
      />
      {eyes()}
      {mouth()}
      {expression === 'sleep' && (
        <text x={50} y={14} className="fill-ink font-display" fontSize={11}>
          z z
        </text>
      )}
    </svg>
  );
}
