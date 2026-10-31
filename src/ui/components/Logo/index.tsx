import "./index.css";

interface LogoProps {
  showName?: boolean;
  size?: number;
  onClick?: (event: MouseEvent) => void;
  disabled?: boolean;
}

export default function Logo({
  showName = false,
  size = 28,
  onClick,
  disabled = false,
}: LogoProps) {
  const inner = (
    <>
      <div className="logo-icon">
        <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="url(#gorin-logo-gradient)" />
          <circle cx="24.5" cy="7.5" r="3" fill="var(--accent)" />
          <g className="logo-glyph">
            <g
              transform="translate(6.4 6.4) scale(0.8)"
              fill="none"
              stroke="#fff"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </g>
          </g>
          <defs>
            <linearGradient id="gorin-logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stop-color="#34d399" />
              <stop offset="1" stop-color="#047857" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showName && <span className="logo-name">Gorin</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className="logo"
        disabled={disabled}
        onClick={onClick}
        aria-label="Back to upload"
      >
        {inner}
      </button>
    );
  }

  return <div className="logo">{inner}</div>;
}
