import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  /** When set, renders as a Next <Link> instead of a <button>. */
  href?: string;
  /** Optional leading or trailing icon. */
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

type ButtonOnlyProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  keyof CommonProps
>;

type Props = CommonProps & ButtonOnlyProps;

const BASE =
  "group inline-flex items-center justify-center gap-2 font-semibold " +
  "transition-[transform,box-shadow,background-color,color] duration-[160ms] " +
  "ease-[cubic-bezier(0.2,0,0,1)] " +
  "focus-visible:outline-none focus-visible:shadow-mk-focus " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "active:translate-y-[0.5px]";

const SIZE: Record<Size, string> = {
  md: "h-10 px-4 text-sm rounded-mk-md",
  lg: "h-12 px-6 text-[15px] rounded-mk-md",
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-mk-primary-500 text-white shadow-mk-1 hover:bg-mk-primary-600 hover:shadow-mk-2",
  secondary:
    "bg-mk-surface text-mk-ink-950 ring-1 ring-inset ring-mk-ink-300 hover:ring-mk-ink-700 hover:bg-mk-ink-50",
  ghost:
    "bg-transparent text-mk-ink-700 hover:bg-mk-ink-100 hover:text-mk-ink-950",
};

/**
 * The only button on the marketing site. Picks variant + size from the
 * design system; never style buttons inline.
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  leading,
  trailing,
  className = "",
  ...rest
}: Props) {
  const classes = `${BASE} ${SIZE[size]} ${VARIANT[variant]} ${className}`;
  const inner = (
    <>
      {leading ? (
        <span className="-ml-0.5 inline-flex" aria-hidden>
          {leading}
        </span>
      ) : null}
      <span>{children}</span>
      {trailing ? (
        <span
          className="-mr-0.5 inline-flex transition group-hover:translate-x-0.5"
          aria-hidden
        >
          {trailing}
        </span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" {...rest} className={classes}>
      {inner}
    </button>
  );
}
