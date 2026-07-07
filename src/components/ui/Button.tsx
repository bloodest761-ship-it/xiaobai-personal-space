import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/styles";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white hover:-translate-y-0.5 hover:bg-primary",
  secondary: "border-border bg-surface text-primary hover:-translate-y-0.5 hover:border-accent",
  ghost: "border-transparent text-secondary hover:text-primary",
  danger: "border-red-300 bg-red-50 text-red-800",
};

export function Button({ href, children, variant = "primary", className }: ButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2 text-sm font-medium transition duration-200",
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
