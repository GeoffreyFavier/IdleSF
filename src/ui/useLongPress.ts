import { useRef } from 'preact/hooks';

/** Pointer handlers firing `onLong` after a press of `ms`; `wasLong()` lets click handlers ignore that press. */
export function useLongPress(onLong: () => void, ms = 450) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const cancel = () => window.clearTimeout(timer.current);
  return {
    handlers: {
      onPointerDown: () => {
        fired.current = false;
        timer.current = window.setTimeout(() => {
          fired.current = true;
          onLong();
        }, ms);
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: Event) => e.preventDefault(),
    },
    wasLong: () => fired.current,
  };
}
