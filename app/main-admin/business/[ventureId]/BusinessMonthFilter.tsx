"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BusinessMonthFilterProps = {
  ventureId: string;
  month: string;
};

export default function BusinessMonthFilter({ ventureId, month }: BusinessMonthFilterProps) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(month);

  useEffect(() => {
    setSelectedMonth(month);
  }, [month]);

  function handleChange(value: string) {
    setSelectedMonth(value);
    if (!value) return;
    router.push(`/main-admin/business/${ventureId}?month=${value}`);
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <label htmlFor="month" className="mb-2 block text-sm font-semibold text-[#0f1729]">
        Month
      </label>
      <input
        id="month"
        type="month"
        value={selectedMonth}
        onChange={(event) => handleChange(event.target.value)}
        className="block w-full max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
      />
    </div>
  );
}
