export function LivesBar({ lives, max = 5 }: { lives: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5" role="status" aria-label={`${lives}/${max}`}>
      {Array.from({ length: max }, (_, index) => {
        const alive = index < lives;
        return (
          <span
            key={index}
            className={`block size-2.5 rounded-full border border-current ${alive ? 'bg-current' : 'bg-transparent opacity-35'}`}
          />
        );
      })}
    </div>
  );
}
