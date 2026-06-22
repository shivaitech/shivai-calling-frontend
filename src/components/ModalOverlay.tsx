import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface ModalOverlayProps {
  open: boolean;
  children: ReactNode;
  /** Applied to the centered panel wrapper (e.g. max-w-lg). */
  panelClassName?: string;
  onClose?: () => void;
  closeOnBackdrop?: boolean;
  zIndex?: number;
}

/**
 * Full-viewport modal shell rendered via portal so `position: fixed` is not clipped
 * by dashboard `overflow-hidden` / transform ancestors. Scroll happens on the overlay,
 * not the page behind it.
 */
const ModalOverlay = ({
  open,
  children,
  panelClassName = '',
  onClose,
  closeOnBackdrop = false,
  zIndex = 100,
}: ModalOverlayProps) => {
  useLockBodyScroll(open);

  if (!open) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) onClose?.();
  };

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex }} role="presentation">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden
        onClick={handleBackdropClick}
      />
      <div className="fixed inset-0 overflow-y-auto overscroll-contain">
        <div
          className="flex min-h-full items-center justify-center p-4 sm:p-6"
          onClick={handleBackdropClick}
        >
          <div
            className={`relative w-full my-auto ${panelClassName}`.trim()}
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalOverlay;
