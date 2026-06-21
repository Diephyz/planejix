import { useState, useEffect, useRef } from 'react';

export function useAnimatedValue(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    const diff = target - from;
    if (diff === 0) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(from + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else prevTarget.current = target;
    }

    requestAnimationFrame(tick);
    return () => { prevTarget.current = target; };
  }, [target, duration]);

  return value;
}
