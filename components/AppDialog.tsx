"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

type AppDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AppDialog({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: AppDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-8 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
