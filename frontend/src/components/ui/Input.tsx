import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftElement, rightElement, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <span className="pointer-events-none absolute left-3 text-gray-400">{leftElement}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 transition-colors",
              "dark:bg-gray-900 dark:text-gray-100",
              "placeholder:text-gray-400 dark:placeholder:text-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-700",
              leftElement && "pl-9",
              rightElement && "pr-9",
              className
            )}
            {...rest}
          />
          {rightElement && (
            <span className="absolute right-3 text-gray-400">{rightElement}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
