import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

export function LivesBar({ lives, max = 5 }: { lives: number; max?: number }) {
  return (
    <div className="flex gap-1.5" role="status" aria-label={`${lives}/${max}`}>
      {Array.from({ length: max }, (_, i) => {
        const alive = i < lives;
        return (
          <motion.span
            key={i}
            animate={alive ? { scale: 1, rotate: 0 } : { scale: 0.85, rotate: -14 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <Heart
              size={22}
              strokeWidth={2.5}
              className={alive ? 'text-neon-pink' : 'text-navy-soft'}
              fill={alive ? 'currentColor' : 'none'}
            />
          </motion.span>
        );
      })}
    </div>
  );
}
