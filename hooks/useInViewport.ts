'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Lazy-loading trigger: reports when an element first comes within `rootMargin` of
 * the viewport. We expand the root box by 10% on the vertical axis so images begin
 * downloading just *before* they scroll into view (the "within 10% of the viewport"
 * requirement) — the user rarely sees a blank slot, yet off-screen images never
 * fetch.
 *
 * `freezeOnceVisible` (default true) stops observing after the first intersection,
 * so an image isn't re-triggered as it scrolls in and out.
 */
export function useInViewport<T extends Element = HTMLDivElement>(options?: {
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}) {
  const { rootMargin = '10% 0px 10% 0px', freezeOnceVisible = true } = options ?? {};
  const ref = useRef<T | null>(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // SSR / very old browsers: no IntersectionObserver -> load eagerly.
    if (typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInViewport(true);
          if (freezeOnceVisible) observer.disconnect();
        } else if (!freezeOnceVisible) {
          setIsInViewport(false);
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin, freezeOnceVisible]);

  return { ref, isInViewport };
}
