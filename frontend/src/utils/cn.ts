import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely — resolves conflicts and deduplicates.
 * @example cn("px-4 py-2", isActive && "bg-brand-500", "text-white")
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
