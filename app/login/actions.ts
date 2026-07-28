"use server";

import { headers } from "next/headers";
import { checkRateLimit } from "@/lib/rateLimit";

function getClientIpFromHeaders(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export async function checkLoginRateLimitAction() {
  const requestHeaders = await headers();
  const ip = getClientIpFromHeaders(requestHeaders);
  return checkRateLimit(ip, "login_attempt", 5);
}
