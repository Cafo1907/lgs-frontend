export function LogoMark({ size = 48, variant = 'mono' }: { size?: number; variant?: 'mono' | 'brand' }) {
  const ringStroke = variant === 'brand' ? 'url(#hedefimlgs-logo-grad)' : 'currentColor';
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {variant === 'brand' && (
        <defs>
          <linearGradient id="hedefimlgs-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7C3AED" />
            <stop offset="1" stopColor="#5B21B6" />
          </linearGradient>
        </defs>
      )}
      <circle cx="34" cy="30" r="25" fill="none" stroke={ringStroke} strokeWidth="3" />
      <circle cx="34" cy="30" r="15.5" fill="none" stroke={ringStroke} strokeWidth="3" opacity="0.75" />
      <path d="M6 58 L24 40" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M24 40 L24 32 L32 32 Z" fill="currentColor" />
      <circle cx="34" cy="30" r="5.5" fill="#FDE68A" />
    </svg>
  );
}

export default function Logo({ size = 48, textColor = '#1C1926' }: { size?: number; textColor?: string }) {
  return (
    <div className="inline-flex items-center" style={{ gap: size * 0.16 }}>
      <LogoMark size={size} />
      <span
        style={{
          fontFamily: "'Fraunces', serif",
          fontWeight: 600,
          fontSize: size * 0.44,
          letterSpacing: '-0.01em',
          color: textColor,
          whiteSpace: 'nowrap',
        }}
      >
        hedefim
        <span
          style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            fontWeight: 700,
            fontSize: size * 0.2,
            letterSpacing: '0.03em',
            verticalAlign: 'super',
            marginLeft: size * 0.04,
            color: '#7C3AED',
          }}
        >
          LGS
        </span>
      </span>
    </div>
  );
}
