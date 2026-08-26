"use client";

import { useIdleTimeout } from "@/lib/useIdleTimeout";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  useIdleTimeout();

  return <>{children}</>;
}
