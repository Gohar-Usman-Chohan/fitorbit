'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { RootState } from '@/redux/store';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
};

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type RoleKey = 'client' | 'trainer' | 'nutritionist' | 'admin';

const ROLE_THEME: Record<
  RoleKey,
  { bar: string; iconBg: string; iconText: string; confirm: string; confirmRing: string }
> = {
  client: {
    bar: 'from-blue-600 to-blue-400',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    confirm: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
    confirmRing: 'focus-visible:ring-blue-500',
  },
  trainer: {
    bar: 'from-green-600 to-green-400',
    iconBg: 'bg-green-50',
    iconText: 'text-green-600',
    confirm: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
    confirmRing: 'focus-visible:ring-green-500',
  },
  nutritionist: {
    bar: 'from-orange-500 to-orange-400',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    confirm: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800',
    confirmRing: 'focus-visible:ring-orange-500',
  },
  admin: {
    bar: 'from-[#4a044e] to-purple-500',
    iconBg: 'bg-purple-50',
    iconText: 'text-[#4a044e]',
    confirm: 'bg-[#4a044e] hover:bg-[#3a033e] active:bg-[#2a022e]',
    confirmRing: 'focus-visible:ring-purple-600',
  },
};

const DANGER_THEME = {
  bar: 'from-red-600 to-red-400',
  iconBg: 'bg-red-50',
  iconText: 'text-red-600',
  confirm: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
  confirmRing: 'focus-visible:ring-red-500',
};

const ConfirmDialogContext = createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null);

export function useConfirm() {
  const confirm = useContext(ConfirmDialogContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return confirm;
}

interface ConfirmDialogModalProps {
  state: ConfirmState;
  onClose: (result: boolean) => void;
}

function ConfirmDialogModal({ state, onClose }: ConfirmDialogModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const userRole = useSelector((s: RootState) => s.auth.user?.role) as RoleKey | undefined;

  const isDanger = state.variant !== 'default';
  const roleTheme = ROLE_THEME[userRole || 'client'] ?? ROLE_THEME.client;
  const theme = isDanger ? DANGER_THEME : roleTheme;

  const title = state.title ?? (isDanger ? 'Confirm action' : 'Please confirm');
  const confirmLabel = state.confirmLabel ?? (isDanger ? 'Delete' : 'Confirm');
  const cancelLabel = state.cancelLabel ?? 'Cancel';

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const Icon = isDanger ? Trash2 : AlertTriangle;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[4px]"
        aria-label="Close dialog"
        onClick={() => onClose(false)}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className={`relative w-full max-w-[440px] overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'
        }`}
      >
        <div className={`h-1 bg-gradient-to-r ${theme.bar}`} />

        <button
          type="button"
          onClick={() => onClose(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="px-6 pb-2 pt-7">
          <div className="flex items-start gap-4 pr-6">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 ${theme.iconBg} ${theme.iconText}`}
            >
              <Icon size={22} strokeWidth={2} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="confirm-dialog-title"
                className="text-xl font-bold tracking-tight text-gray-900"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-message"
                className="mt-2 text-sm leading-relaxed text-gray-600"
              >
                {state.message}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/90 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => onClose(false)}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose(true)}
            className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${theme.confirm} ${theme.confirmRing}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setState((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  return (
    <ConfirmDialogContext.Provider value={confirm}>
      {children}
      {state ? <ConfirmDialogModal state={state} onClose={handleClose} /> : null}
    </ConfirmDialogContext.Provider>
  );
}
