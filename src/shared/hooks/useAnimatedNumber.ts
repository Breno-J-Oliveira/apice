import { useEffect, useRef, useState } from 'react';

/** Hook para animar números com efeito count-up */
export function useAnimatedNumber(
  target: number,
  duration = 800,
  enabled = true
): number {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!enabled || target === prevTarget.current) {
      setDisplay(target);
      prevTarget.current = target;
      return;
    }

    const startValue = prevTarget.current;
    prevTarget.current = target;
    const startTime = performance.now();
    const diff = target - startValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(startValue + diff * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, enabled]);

  return Math.round(display);
}