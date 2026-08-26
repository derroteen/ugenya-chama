"use client";

import { useIdleTimeout } from "@/lib/useIdleTimeout";

export default function MainAdminLayout({ children }: { children: React.ReactNode }) {
  useIdleTimeout();

  return <>{children}</>;
}
