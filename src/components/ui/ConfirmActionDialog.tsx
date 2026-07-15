"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmActionDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  confirmationText?: string;
  confirmationValue?: string;
  onConfirmationValueChange?: (value: string) => void;
  isSubmitting?: boolean;
  submittingLabel?: string;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "取消",
  danger = false,
  confirmationText,
  confirmationValue = "",
  onConfirmationValueChange,
  isSubmitting = false,
  submittingLabel = "正在处理…",
  error,
  onCancel,
  onConfirm,
  returnFocusRef,
}: ConfirmActionDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const canConfirm = !confirmationText || confirmationValue === confirmationText;

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const returnFocusTarget = returnFocusRef?.current ?? previousFocus;
    const focusTarget = inputRef.current ?? dialogRef.current?.querySelector<HTMLElement>("button");
    focusTarget?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnFocusTarget?.focus?.();
    };
  }, [isSubmitting, onCancel, open, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl sm:p-6"
      >
        <h2 id={titleId} className="text-xl font-semibold text-primary">{title}</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-7 text-secondary">{description}</p>
        {confirmationText ? (
          <label className="mt-5 block text-sm font-medium text-primary">
            输入“{confirmationText}”以继续
            <input
              ref={inputRef}
              value={confirmationValue}
              onChange={(event) => onConfirmationValueChange?.(event.target.value)}
              disabled={isSubmitting}
              className="mt-2 min-h-11 w-full rounded-xl border border-border bg-page px-3 text-sm outline-none focus:border-accent disabled:opacity-60"
            />
          </label>
        ) : null}
        {error ? <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="min-h-11 rounded-full border border-border px-5 py-2 text-sm font-medium text-primary disabled:opacity-60">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={isSubmitting || !canConfirm} className={`min-h-11 rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? "bg-red-700" : "bg-accent"}`}>{isSubmitting ? submittingLabel : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
