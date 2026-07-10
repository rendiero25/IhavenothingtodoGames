import type { ButtonHTMLAttributes } from 'react';

type Color = 'coral' | 'teal' | 'amber' | 'pink' | 'ink';
type Size = 'md' | 'lg' | 'xl';

const COLORS: Record<Color, string> = {
  coral: 'bg-coral text-cream',
  teal: 'bg-teal text-cream',
  amber: 'bg-amber text-ink',
  pink: 'bg-pink text-cream',
  ink: 'bg-ink text-cream',
};

const SIZES: Record<Size, string> = {
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-7 py-3.5 text-xl rounded-2xl',
  xl: 'px-10 py-5 text-3xl rounded-3xl',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: Color;
  size?: Size;
}

export function ChunkyButton({ color = 'coral', size = 'md', className = '', ...rest }: Props) {
  return (
    <button
      className={`font-display tracking-wide border-[3px] border-ink select-none
        shadow-[0_6px_0_0_var(--color-ink)] active:translate-y-[6px] active:shadow-none
        transition-[transform,box-shadow] duration-100 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${COLORS[color]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  );
}
