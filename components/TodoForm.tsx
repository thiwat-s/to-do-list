"use client";

import { useState } from "react";

type TodoFormProps = {
  label: string;
  placeholder: string;
  submitText: string;
  onSubmit: (value: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  maxLength?: number;
};

export default function TodoForm({
  label,
  placeholder,
  submitText,
  onSubmit,
  disabled = false,
  className,
  buttonClassName,
  maxLength,
}: TodoFormProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmedValue = value.trim();
  const isDisabled = disabled || submitting;
  const isSubmitDisabled = isDisabled || trimmedValue.length === 0;

  const submitValue = async () => {
    if (trimmedValue.length === 0 || isDisabled) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(trimmedValue);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <label className="sr-only">{label}</label>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            value={value}
            maxLength={maxLength}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void submitValue();
              }
            }}
            placeholder={placeholder}
            disabled={isDisabled}
          />
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={() => void submitValue()}
            className={buttonClassName ?? "rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"}
          >
            {submitText}
          </button>
        </div>
        {typeof maxLength === "number" ? (
          <p className="text-right text-xs text-slate-400">
            {value.length}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}
