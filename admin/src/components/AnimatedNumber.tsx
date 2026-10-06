import { useEffect, useRef } from 'react';
import gsap from 'gsap';

type Props = {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
};

const defaultFormat = (n: number) => new Intl.NumberFormat('es-MX').format(Math.round(n));

/** Counts from the previous value to the new one, so refreshes animate the difference. */
export function AnimatedNumber({ value, format = defaultFormat, duration = 1.4, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef({ v: 0 });
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tween = gsap.to(current.current, {
      v: value,
      duration,
      delay,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = formatRef.current(current.current.v);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, duration, delay]);

  return <span ref={ref}>{format(0)}</span>;
}
