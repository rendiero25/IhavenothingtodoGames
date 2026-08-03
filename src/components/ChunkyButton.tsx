import type { ButtonHTMLAttributes } from 'react';

type Color = 'coral' | 'teal' | 'amber' | 'pink' | 'ink';
type Size = 'md' | 'lg' | 'xl';

const SIZES: Record<Size, string> = {
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-11 px-5 py-2.5 text-base',
  xl: 'min-h-12 px-6 py-3 text-lg',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: Color;
  size?: Size;
}

export function ChunkyButton({ color = 'coral', size = 'md', className = '', ...rest }: Props) {
  const filled = color === 'ink' || color === 'coral' || color === 'teal';
  return (
    <button
      className={`cursor-pointer select-none rounded-md border border-ink font-medium outline-none transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-45 ${filled ? 'bg-ink text-paper hover:bg-paper hover:text-ink' : 'bg-paper text-ink hover:bg-ink hover:text-paper'} focus-visible:bg-ink focus-visible:text-paper ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
