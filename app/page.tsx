import Link from "next/link";
import { Lora, Source_Sans_3 } from "next/font/google";

const displayFont = Lora({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const branches = [
  "Huruma",
  "King'ong'o",
  "Langas",
  "Kipkaren",
  "Kidiwa",
  "Racecourse",
  "Baringo",
  "Central Huruma",
  "Kahoya",
  "Kamkunji",
  "Kisumu Ndogo",
  "East Huruma",
];

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className={`${bodyFont.className} min-h-screen bg-white text-[#475569]`}>
      <header id="home" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-end gap-3">
              <p className={`${displayFont.className} text-3xl font-bold tracking-wide text-[#0f1729]`}>
                UAE
              </p>
              <p className="pb-1 text-sm text-[#0f1729]">Ugenya Association Eldoret</p>
            </div>
            <div className="h-0.5 w-20 bg-[#c9a227]" aria-hidden="true" />
            <p className="text-sm italic text-[#c9a227]">Riwruok Eteko</p>
          </div>

          <nav aria-label="Primary" className="border-t border-slate-100 pt-3">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#0f1729]">
              <li>
                <a
                  href="#home"
                  className="rounded-sm px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="rounded-sm px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#branches"
                  className="rounded-sm px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  Branches
                </a>
              </li>
              <li>
                <a
                  href="#membership"
                  className="rounded-sm px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  Membership
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="rounded-sm px-1 py-0.5 text-[#1d3a8a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  Login
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-sm font-semibold tracking-wide text-[#1d3a8a]">Ugenya Association Eldoret</p>
          <h1 className={`${displayFont.className} mt-2 text-3xl font-bold leading-tight text-[#0f1729] sm:text-4xl`}>
            Ugenya Association Eldoret (UAE)
          </h1>
          <p className="mt-2 text-base italic text-[#c9a227]">Riwruok Eteko</p>
          <p className="mt-4 max-w-3xl text-base leading-7">
            UAE is a community savings and welfare association supporting members and households across all its branches.
          </p>
          <Link
            href="/documents/UAE-Membership-Application-Form.pdf"
            className="mt-7 inline-flex rounded-md bg-[#1d3a8a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
          >
            Download Membership Application Form
          </Link>
        </div>
      </section>

      <section id="about" className="bg-[#eef2ff]">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>About UAE</h2>
          <div className="mt-5 max-w-4xl space-y-4 text-base leading-7">
            <p>
              Ugenya Association Eldoret was established to help members build stable savings habits and strengthen one another through disciplined contribution and accountability.
            </p>
            <p>
              Beyond savings, the association provides welfare support to members and families during difficult moments, including bereavement, illness, and other urgent needs that call for community solidarity.
            </p>
            <p>
              Our guiding motto, <span className="italic text-[#c9a227]">Riwruok Eteko</span>, reminds us that unity is strength: when members stand together, each household is better protected and the whole community advances.
            </p>
          </div>
        </div>
      </section>

      <section id="branches" className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex items-center gap-3">
            <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>Branches</h2>
            <div className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm sm:text-base">UAE serves members through the following branches:</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <li
                key={branch}
                className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-[#0f1729]"
              >
                {branch}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="membership" className="bg-[#eef2ff]">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>Membership</h2>
          <p className="mt-4 max-w-4xl text-base leading-7">
            To join UAE, download the membership application form, complete all required details, and submit the signed form to your nearest branch chairman for review and registration.
          </p>
          <Link
            href="/documents/UAE-Membership-Application-Form.pdf"
            className="mt-7 inline-flex rounded-md bg-[#1d3a8a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
          >
            Download Membership Application Form
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm sm:px-6 lg:px-8">
          <p className="text-[#0f1729]">P.O. Box 105-30100, Eldoret</p>
          <p>
            Contact: <a href="mailto:info@uae.example" className="text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]">info@uae.example</a>
          </p>
          <p className="text-slate-500">© {year} Ugenya Association Eldoret (UAE). All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
