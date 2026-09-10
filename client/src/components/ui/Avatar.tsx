import React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_MAP: Record<AvatarSize, { dim: number; fs: string }> = {
  xs: { dim: 24, fs: '0.625rem' },
  sm: { dim: 30, fs: '0.6875rem' },
  md: { dim: 36, fs: '0.75rem' },
  lg: { dim: 44, fs: '0.875rem' },
  xl: { dim: 56, fs: '1.125rem' },
  '2xl': { dim: 72, fs: '1.375rem' },
};

const PALETTE: [string, string][] = [
  ['#e0e7ff', '#4f46e5'],
  ['#dcfce7', '#059669'],
  ['#ede9fe', '#7c3aed'],
  ['#fef3c7', '#d97706'],
  ['#fce7f3', '#db2777'],
  ['#e0f2fe', '#0284c7'],
  ['#ccfbf1', '#0d9488'],
  ['#fee2e2', '#dc2626'],
];

function getColorFromName(name: string): [string, string] {
  if (!name) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  style?: React.CSSProperties;
  status?: 'online' | 'offline' | 'busy' | 'away' | string;
}

export function Avatar({
  src,
  name,
  firstName,
  lastName,
  size = 'md',
  style,
  status,
}: AvatarProps) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const fullName = name || `${firstName || ''} ${lastName || ''}`.trim() || 'User';
  const initials =
    fullName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const [bg, fg] = getColorFromName(fullName);

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <div
        style={{
          width: sizeConfig.dim,
          height: sizeConfig.dim,
          borderRadius: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: src ? 'transparent' : bg,
          color: fg,
          fontSize: sizeConfig.fs,
          fontWeight: 750,
          boxShadow: 'var(--shadow-xs), 0 0 0 1px var(--border)',
          ...style,
        }}
      >
        {src ? (
          <img src={src} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials
        )}
      </div>

      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size === 'xs' || size === 'sm' ? 7 : 9,
            height: size === 'xs' || size === 'sm' ? 7 : 9,
            borderRadius: '50%',
            background:
              status === 'online'
                ? 'var(--success)'
                : status === 'busy'
                ? 'var(--error)'
                : status === 'away'
                ? 'var(--warning)'
                : 'var(--text-quaternary)',
            border: '1.5px solid var(--bg-primary)',
            boxShadow: status === 'online' ? '0 0 6px var(--success)' : 'none',
          }}
        />
      )}
    </div>
  );
}
export default Avatar;
