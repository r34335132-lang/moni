import { useLayoutEffect, type DependencyList, type RefObject } from 'react';
import gsap from 'gsap';

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Entrance tweens finish on the first frame; infinite loops must check `reducedMotion` themselves.
if (reducedMotion) gsap.globalTimeline.timeScale(1000);

/** Staggered rise-in for every `.reveal` element inside the scope. */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  useLayoutEffect(() => {
    if (!scope.current) return;
    const ctx = gsap.context(() => {
      gsap.from('.reveal', {
        y: 28,
        opacity: 0,
        scale: 0.985,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.07,
        clearProps: 'transform,opacity',
      });
    }, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
