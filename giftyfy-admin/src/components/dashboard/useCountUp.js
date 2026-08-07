import { useEffect, useRef, useState } from "react";

/**
 * useCountUp
 * Animates a numeric value from 0 -> target whenever `target` changes.
 * Pure UI polish — does not touch any data-fetching logic.
 *
 * @param {number} target - final numeric value to animate to
 * @param {number} duration - animation duration in ms
 */
const useCountUp = (target = 0, duration = 900) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(target) || 0;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (to - from) * eased);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setValue(to);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
};

export default useCountUp;