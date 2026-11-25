'use client';
import { useEffect, useRef, type ReactNode } from 'react';

/** Backdrop + container for drawers and modals. Closes on backdrop click; traps initial focus. */
export function Scrim({ onClose, variant, label, children }: { onClose(): void; variant: 'drawer' | 'modal' | 'palette'; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[autofocus], input, select, textarea, button');
    el?.focus();
  }, []);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={variant} role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  );
}
