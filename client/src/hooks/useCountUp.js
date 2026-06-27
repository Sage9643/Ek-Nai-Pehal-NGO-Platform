import { useEffect, useRef, useState } from 'react';

export function useCountUp(target, duration = 2000, suffix = '') {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  // Parse target number
  const numericTarget = parseInt(String(target).replace(/\D/g, ''), 10);
  const hasSuffix = /[+,]/.test(String(target));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;

    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * numericTarget));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, numericTarget, duration]);

  const display = count >= 1000 
    ? count.toLocaleString('en-IN')
    : count.toString();

  return { ref, display: display + (hasSuffix ? '+' : '') + suffix };
}
