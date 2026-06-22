import { useEffect } from 'react';

let lockCount = 0;

/**
 * Prevents the page behind a modal from scrolling. Supports nested modals via a ref count.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    lockCount += 1;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      lockCount -= 1;
      if (lockCount <= 0) {
        lockCount = 0;
        body.style.overflow = prevOverflow;
        body.style.paddingRight = prevPaddingRight;
      }
    };
  }, [locked]);
}
