'use client';

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalAccent = 'blue' | 'green' | 'orange';

const ACCENT_THEME: Record<
  ModalAccent,
  { bar: string; iconBg: string; iconText: string; primary: string; primaryRing: string }
> = {
  blue: {
    bar: 'from-blue-600 to-blue-400',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
    primaryRing: 'focus-visible:ring-blue-500',
  },
  green: {
    bar: 'from-emerald-600 to-emerald-400',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    primary: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
    primaryRing: 'focus-visible:ring-emerald-500',
  },
  orange: {
    bar: 'from-orange-500 to-orange-400',
    iconBg: 'bg-orange-50',
    iconText: 'text-orange-600',
    primary: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800',
    primaryRing: 'focus-visible:ring-orange-500',
  },
};

export const modalFieldClass =
  'w-full rounded-lg border border-gray-200 bg-gray-50/60 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10';

export const modalLabelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: ModalAccent;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
}

const SIZE_CLASS = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function FormModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  accent = 'blue',
  size = 'lg',
  children,
  footer,
  closeOnBackdrop = true,
}: FormModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const theme = ACCENT_THEME[accent];

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => setVisible(true));
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[6px]"
        aria-label="Close dialog"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200/80 bg-white shadow-[0_25px_80px_-12px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out sm:rounded-2xl ${SIZE_CLASS[size]} ${
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.98] opacity-0 sm:translate-y-2'
        }`}
      >
        <div className={`h-1 shrink-0 bg-gradient-to-r ${theme.bar}`} />

        <div className="relative shrink-0 border-b border-gray-100 px-6 pb-4 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 pr-8">
            {icon ? (
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 ${theme.iconBg} ${theme.iconText}`}
              >
                {icon}
              </div>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 id="form-modal-title" className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/90 px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ModalPrimaryButton({
  accent = 'blue',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { accent?: ModalAccent }) {
  const theme = ACCENT_THEME[accent];
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${theme.primary} ${theme.primaryRing} ${className}`}
      {...props}
    />
  );
}

export function ModalSecondaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
