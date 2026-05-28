import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /**
   * When true, Button renders its child directly, merging all button
   * styles and props onto it. Use with <Link> from react-router-dom.
   * @example <Button asChild><Link to="/login">Sign in</Link></Button>
   */
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-500",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus-visible:ring-gray-400",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:ring-gray-400",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500",
  outline:
    "border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:ring-gray-400",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      asChild = false,
      ...rest
    },
    ref
  ) => {
    const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

    // When asChild=true, clone the single child and merge button styles onto it.
    // This lets <Button asChild><Link to="…">text</Link></Button> work correctly.
    if (asChild && children) {
      const child = children as React.ReactElement;
      return {
        ...child,
        props: {
          ...child.props,
          className: cn(classes, child.props.className as string),
          ref,
        },
      } as unknown as React.ReactElement;
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...rest}
      >
        {isLoading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
