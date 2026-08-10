"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface PublicHeaderProps {
  brandClassName: string;
}

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Branches", href: "#branches" },
  { label: "Membership", href: "#membership" },
];

export default function PublicHeader({ brandClassName }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header id="home" className="sticky top-0 z-50 border-b border-[#1d3a8a] bg-[#0f1729]">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/uae-logo-monogram.svg"
              alt="Ugenya Association Eldoret monogram"
              width={42}
              height={42}
              className="h-10 w-10 flex-none"
              priority
            />
            <p className={`${brandClassName} truncate text-lg font-semibold text-white sm:text-xl`}>
              Ugenya Association Eldoret
            </p>
          </div>

          <div className="flex items-center gap-3">
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-6 text-sm font-semibold text-white">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="rounded-sm px-1 py-0.5 transition hover:text-[#c9a227] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    href="/select-branch"
                    className="inline-flex items-center gap-2 rounded-full bg-[#c9a227] px-4 py-2 text-sm font-semibold text-[#0f1729] transition hover:bg-[#b89220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                  >
                    <span>Member Login</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              </ul>
            </nav>

            <button
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 p-2 text-white hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] md:hidden"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <nav aria-label="Mobile Primary" className="mt-4 border-t border-slate-200 pt-4 md:hidden">
            <ul className="space-y-2 text-sm font-semibold text-white">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-md px-2.5 py-2 transition hover:bg-slate-50 hover:text-[#c9a227] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href="/select-branch"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c9a227] px-4 py-3 text-sm font-semibold text-[#0f1729] transition hover:bg-[#b89220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  <span>Member Login</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </div>
    </header>
  );
}