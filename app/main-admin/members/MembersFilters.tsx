"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BranchOption = {
  id: string;
  name: string;
  code: string;
};

type MembersFiltersProps = {
  branches: BranchOption[];
  branch: string;
  q: string;
};

export default function MembersFilters({ branches, branch, q }: MembersFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushParams(next: { branch?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextBranch = next.branch ?? branch;
    const nextQ = next.q ?? searchValue;

    if (nextBranch) {
      params.set("branch", nextBranch);
    } else {
      params.delete("branch");
    }

    if (nextQ) {
      params.set("q", nextQ);
    } else {
      params.delete("q");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleBranchChange(value: string) {
    pushParams({ branch: value });
  }

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ q: value });
    }, 300);
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="branch" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Branch
          </label>
          <select
            id="branch"
            name="branch"
            value={branch}
            onChange={(event) => handleBranchChange(event.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          >
            <option value="">All Branches</option>
            {branches.map((option) => (
              <option key={option.id} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="q" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Search Members
          </label>
          <input
            id="q"
            name="q"
            type="search"
            value={searchValue}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by full name or member ID"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>
      </div>
    </div>
  );
}
