'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = '', ...props }, ref) {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={`
            rounded-lg border px-3 py-2 text-sm
            transition-colors duration-150
            placeholder:text-zinc-400 dark:placeholder:text-zinc-500
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-zinc-300 focus:ring-zinc-900 dark:border-zinc-600 dark:focus:ring-zinc-100'
            }
            bg-white dark:bg-zinc-900
            text-zinc-900 dark:text-zinc-100
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}
          `}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        {hint && !error ? (
          <p id={hintId} className="text-xs text-zinc-500 dark:text-zinc-400">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
