import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

const useLockBodyScroll = (active = true) => {
  useEffect(() => {
    if (!active) return undefined;

    const body = document.body;

    if (lockCount === 0) {
      originalOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        body.style.overflow = originalOverflow;
      }
    };
  }, [active]);
};

export default useLockBodyScroll;