"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FuneralSheetsFiltersProps = {
  event: string;
  from: string;
  to: string;
};

export default function FuneralSheetsFilters({ event, from, to }: FuneralSheetsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [eventValue, setEventValue] = useState(event);
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setEventValue(event);
    setFromValue(from);
    setToValue(to);
  }, [event, from, to]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function pushParams(next: { event?: string; from?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextEvent = next.event ?? eventValue;
    const nextFrom = next.from ?? fromValue;
    const nextTo = next.to ?? toValue;

    if (nextEvent) {
      params.set("event", nextEvent);
    } else {
      params.delete("event");
    }

    if (nextFrom) {
      params.set("from", nextFrom);
    } else {
      params.delete("from");
    }

    if (nextTo) {
      params.set("to", nextTo);
    } else {
      params.delete("to");
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleEventChange(value: string) {
    setEventValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams({ event: value });
    }, 300);
  }

  function handleFromChange(value: string) {
    setFromValue(value);
    pushParams({ from: value });
  }

  function handleToChange(value: string) {
    setToValue(value);
    pushParams({ to: value });
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="event" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            Search Event
          </label>
          <input
            id="event"
            type="search"
            value={eventValue}
            onChange={(e) => handleEventChange(e.target.value)}
            placeholder="Search by event description"
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>

        <div>
          <label htmlFor="from" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            From
          </label>
          <input
            id="from"
            type="date"
            value={fromValue}
            onChange={(e) => handleFromChange(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>

        <div>
          <label htmlFor="to" className="mb-2 block text-sm font-semibold text-[#0f1729]">
            To
          </label>
          <input
            id="to"
            type="date"
            value={toValue}
            onChange={(e) => handleToChange(e.target.value)}
            className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-[#1d3a8a] focus:ring-2 focus:ring-[#bfdbfe]"
          />
        </div>
      </div>
    </div>
  );
}
