"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "superadmin" | "main_admin" | "branch_admin" | "member";

type NavLink = {
  label: string;
  href: string;
};

type IconName = "dashboard" | "member-add" | "admins" | "branches" | "members";

type NavLinkConfig = NavLink & {
  icon: IconName;
};

const roleLinks: Record<Role, NavLinkConfig[]> = {
  superadmin: [
    { label: "Dashboard", href: "/superadmin", icon: "dashboard" },
    { label: "Members", href: "/branch-admin/members", icon: "members" },
    { label: "Manage Admins", href: "/superadmin/admins", icon: "admins" },
  ],
  main_admin: [
    { label: "Dashboard", href: "/main-admin", icon: "dashboard" },
    { label: "Members", href: "/branch-admin/members", icon: "members" },
    { label: "Branches", href: "/main-admin/branches", icon: "branches" },
  ],
  branch_admin: [
    { label: "Dashboard", href: "/branch-admin", icon: "dashboard" },
    { label: "Members", href: "/branch-admin/members", icon: "members" },
    { label: "Add Member", href: "/branch-admin/members/new", icon: "member-add" },
  ],
  member: [{ label: "Dashboard", href: "/member", icon: "dashboard" }],
};

const roleSubtitles: Record<Role, string> = {
  member: "MEMBERS PORTAL",
  branch_admin: "BRANCH ADMIN PORTAL",
  main_admin: "MAIN ADMIN PORTAL",
  superadmin: "SUPERADMIN PORTAL",
};

function isRole(value: string | null | undefined): value is Role {
  return (
    value === "superadmin" ||
    value === "main_admin" ||
    value === "branch_admin" ||
    value === "member"
  );
}

function getAvatarText(displayName: string) {
  const normalized = displayName.trim();
  if (!normalized) return "UA";

  const compact = normalized.replace(/\s+/g, "");
  return compact.slice(0, 2).toUpperCase();
}

function NavIcon({ icon }: { icon: IconName }) {
  if (icon === "member-add") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 10-12 0" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 8v6M16 11h6" />
      </svg>
    );
  }

  if (icon === "admins") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 5h12M6 10h12M6 15h8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 15h5M19.5 12.5v5" />
      </svg>
    );
  }

  if (icon === "members") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19a5 5 0 0110 0" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 19a4 4 0 018 0" />
      </svg>
    );
  }

  if (icon === "branches") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20V8l6-4 6 4v12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20v-4h4v4" />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  if (pathname === "/" || pathname === "/login" || pathname === "/select-branch") {
    return null;
  }

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadNavData() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isActive) return;

        if (sessionError || !session) {
          if (sessionError) {
            console.error("NavBar: failed to get session", sessionError);
          }
          setHasSession(false);
          return;
        }

        setHasSession(true);

        const userId = session.user.id;
        const fallbackName = session.user.email ?? "User";

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", userId)
          .maybeSingle();

        if (!isActive) return;

        if (profileError) {
          console.error("NavBar: failed to fetch profile", profileError);
        }

        const resolvedRole = isRole(profile?.role) ? profile.role : null;
        setRole(resolvedRole);

        if (resolvedRole === "member") {
          const { data: member, error: memberError } = await supabase
            .from("members")
            .select("member_id")
            .eq("auth_id", userId)
            .maybeSingle();

          if (!isActive) return;

          if (memberError) {
            console.error("NavBar: failed to fetch member record", memberError);
          }

          setDisplayName(member?.member_id ?? profile?.full_name ?? fallbackName);
        } else {
          setDisplayName(profile?.full_name ?? fallbackName);
        }
      } catch (error) {
        if (!isActive) return;
        console.error("NavBar: unexpected load error", error);
        setHasSession(false);
      } finally {
        if (isActive) {
          setIsLoaded(true);
        }
      }
    }

    loadNavData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;

      if (!session) {
        setHasSession(false);
        setRole(null);
        setDisplayName("");
        setIsLoaded(true);
        return;
      }

      void loadNavData();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    setHasSession(false);
    setRole(null);
    setDisplayName("");

    await supabase.auth.signOut({ scope: "local" });
    router.push("/");
    router.refresh();
  }

  if (!isLoaded || !hasSession) {
    return null;
  }

  const links = role ? roleLinks[role] : [];
  const avatarText = getAvatarText(displayName);
  const portalSubtitle = role ? roleSubtitles[role] : "USER PORTAL";

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0f1729] text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            aria-label="Open navigation drawer"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 text-slate-100 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0 flex-1 px-1">
            <p className="truncate text-sm font-semibold text-slate-100 sm:text-[15px]">
              Ugenya Association Eldoret
            </p>
          </div>

          <button
            type="button"
            aria-label="Open navigation drawer"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#c9a227] text-sm font-bold tracking-wide text-[#0f1729] transition hover:bg-[#b89220] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a227]"
          >
            {avatarText}
          </button>
        </div>
      </header>

      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-950/55 transition-opacity duration-300 ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!menuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col bg-[#0f1729] text-white shadow-2xl transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 pb-5 pt-6">
          <div>
            <p className="text-lg font-semibold text-[#c9a227]">Ugenya Association Eldoret</p>
            <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-slate-400">
              {portalSubtitle}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close navigation drawer"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 text-slate-200 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <span className="text-[#c9a227]">
                    <NavIcon icon={link.icon} />
                  </span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 px-5 py-5">
          <p className="truncate text-sm text-slate-300">{displayName}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
