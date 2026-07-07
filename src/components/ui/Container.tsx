import type { ReactNode } from "react";
import { cn } from "@/lib/styles";

type ContainerProps = {
  children: ReactNode;
  className?: string;
  size?: "page" | "reading";
};

export function Container({ children, className, size = "page" }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        size === "page" ? "max-w-page" : "max-w-reading",
        className,
      )}
    >
      {children}
    </div>
  );
}
