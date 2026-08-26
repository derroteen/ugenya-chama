"use client";

import { useIdleTimeout } from "@/lib/useIdleTimeout";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  useIdleTimeout();

  return <>{children}</>;
}
