"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Re-keys children by pathname so the CSS enter animation re-runs on each
 * route change — gives every navigation a smooth fade-up.
 */
export function PageMount({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-page-enter">
      {children}
    </div>
  );
}
