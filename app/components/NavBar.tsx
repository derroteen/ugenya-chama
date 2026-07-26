"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "superadmin" | "main_admin" | "branch_admin" | "member";

type NavLink = {
  label: string;
  href: string;
};

const roleLinks: Record<Role, NavLink[]> = {
  superadmin: [
    { label: "Dashboard", href: "/superadmin" },
    { label: "Manage Admins", href: "/superadmin/admins" },
  ],
  main_admin: [
    { label: "Dashboard", href: "/main-admin" },
    { label: "Branches", href: "/main-admin/branches" },
  ],
  branch_admin: [
    { label: "Dashboard", href: "/branch-admin" },
    { label: "Add Member", href: "/branch-admin/members/new" },
  ],
  member: [{ label: "Dashboard", href: "/member" }],
};

function isRole(value: string | null | undefined): value is Role {
  return (
    value === "superadmin" ||
    value === "main_admin" ||
    value === "branch_admin" ||
    value === "member"
  );
}

export default function NavBar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

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

  async function handleLogout() {
    setHasSession(false);
    setRole(null);
    setDisplayName("");

    await supabase.auth.signOut({ scope: "local" });
    router.push("/login");
    router.refresh();
  }

  if (!isLoaded || !hasSession) {
    return null;
  }

  const links = role ? roleLinks[role] : [];

  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-md border border-slate-700 p-2 text-slate-100 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:hidden"
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

          <nav className="hidden items-center gap-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="max-w-[150px] truncate text-sm text-slate-200 sm:max-w-none">
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-slate-800 px-4 pb-3 pt-2 md:hidden">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2.5 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
