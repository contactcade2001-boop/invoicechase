import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Override the default 1120px max — useful for narrow text sections. */
  width?: "default" | "narrow" | "wide";
};

/**
 * Centers content with consistent horizontal padding. The single source
 * of truth for max-width on marketing pages.
 */
export function Container({
  children,
  width = "default",
  className = "",
  ...rest
}: Props) {
  const max =
    width === "narrow"
      ? "max-w-[720px]"
      : width === "wide"
        ? "max-w-[1280px]"
        : "max-w-[1120px]";
  return (
    <div
      {...rest}
      className={`mx-auto w-full px-5 sm:px-8 ${max} ${className}`}
    >
      {children}
    </div>
  );
}
