import { useMemo } from 'react';

const COLORS = ['#10B981', '#34D399', '#6EE7B7', '#6366f1', '#F59E0B', '#ec4899', '#22c55e'];

/**
 * Chuva de confetes em tela cheia (CSS puro, sem dependências).
 * O componente pai controla a montagem/desmontagem (ex: 4s via setTimeout).
 * Respeita prefers-reduced-motion via regra global do index.css.
 */
export default function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.8,
        rounded: Math.random() > 0.5,
      })),
    [count],
  );

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-5vh',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.rounded ? 1 : 0.45),
            backgroundColor: p.color,
            borderRadius: p.rounded ? '50%' : '2px',
            animation: `confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}
