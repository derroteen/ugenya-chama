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

      <section className="relative isolate overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
          <svg viewBox="0 0 1400 700" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <g stroke="#c9a227" strokeOpacity="0.22" strokeWidth="1">
              <line x1="90" y1="130" x2="300" y2="90" />
              <line x1="300" y1="90" x2="520" y2="160" />
              <line x1="520" y1="160" x2="760" y2="120" />
              <line x1="760" y1="120" x2="1020" y2="190" />
              <line x1="1020" y1="190" x2="1240" y2="150" />
              <line x1="160" y1="280" x2="350" y2="340" />
              <line x1="350" y1="340" x2="560" y2="290" />
              <line x1="560" y1="290" x2="760" y2="360" />
              <line x1="760" y1="360" x2="980" y2="320" />
              <line x1="980" y1="320" x2="1180" y2="400" />
              <line x1="250" y1="520" x2="480" y2="460" />
              <line x1="480" y1="460" x2="710" y2="520" />
              <line x1="710" y1="520" x2="940" y2="470" />
              <line x1="940" y1="470" x2="1160" y2="540" />
            </g>
            <g fill="#c9a227" fillOpacity="0.32">
              <circle cx="90" cy="130" r="4" />
              <circle cx="300" cy="90" r="3.5" />
              <circle cx="520" cy="160" r="4" />
              <circle cx="760" cy="120" r="3.5" />
              <circle cx="1020" cy="190" r="4" />
              <circle cx="1240" cy="150" r="3.5" />
              <circle cx="160" cy="280" r="3" />
              <circle cx="350" cy="340" r="4" />
              <circle cx="560" cy="290" r="3.5" />
              <circle cx="760" cy="360" r="4" />
              <circle cx="980" cy="320" r="3.5" />
              <circle cx="1180" cy="400" r="4" />
              <circle cx="250" cy="520" r="3.5" />
              <circle cx="480" cy="460" r="4" />
              <circle cx="710" cy="520" r="3.5" />
              <circle cx="940" cy="470" r="4" />
              <circle cx="1160" cy="540" r="3.5" />
            </g>
          </svg>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pb-12 sm:pt-24 lg:px-8 lg:pb-14 lg:pt-28">
          <div className="relative z-10 max-w-5xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1d3a8a] sm:text-sm">
              Established Community Association • 12 Branches
            </p>
            <h1 className={`${displayFont.className} mt-4 text-5xl font-bold leading-[1.03] text-[#0f1729] sm:text-6xl lg:text-7xl`}>
            Ugenya Association Eldoret (UAE)
            </h1>
            <p className="mt-4 text-lg italic text-[#c9a227] sm:text-xl">Riwruok Eteko</p>
            <p className="mt-6 max-w-3xl text-lg leading-8">
              UAE is a community savings and welfare association supporting members and households across all its branches.
            </p>
            <Link
              href="/documents/UAE-Membership-Application-Form.pdf"
              className="mt-10 inline-flex rounded-md bg-[#1d3a8a] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
            >
              Download Membership Application Form
            </Link>
          </div>
        </div>
      </section>

      <section id="about" className="relative overflow-hidden bg-[#eef2ff]">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,41,0.10) 1px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8 lg:pb-28 lg:pt-16">
          <h2 className={`${displayFont.className} text-3xl font-bold text-[#0f1729] sm:text-4xl`}>About UAE</h2>
          <div className="mt-7 max-w-4xl space-y-5 text-lg leading-8">
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

      <section id="branches" className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,41,0.08) 1px, transparent 1.5px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="flex items-center gap-3">
            <h2 className={`${displayFont.className} text-3xl font-bold text-[#0f1729] sm:text-4xl`}>Branches</h2>
            <div className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          <p className="mt-4 text-base sm:text-lg">UAE serves members through the following branches:</p>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => (
              <li
                key={branch}
                className="group rounded-xl border border-slate-200/90 bg-white/90 px-5 py-4 text-base font-semibold text-[#0f1729] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="mb-2 block h-1 w-7 rounded-full bg-[#c9a227]" aria-hidden="true" />
                {branch}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="membership" className="relative overflow-hidden bg-[#eef2ff]">
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,41,0.10) 1px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <h2 className={`${displayFont.className} text-3xl font-bold text-[#0f1729] sm:text-4xl`}>Membership</h2>
          <p className="mt-6 max-w-4xl text-lg leading-8">
            To join UAE, download the membership application form, complete all required details, and submit the signed form to your nearest branch chairman for review and registration.
          </p>
          <Link
            href="/documents/UAE-Membership-Application-Form.pdf"
            className="mt-10 inline-flex rounded-md bg-[#1d3a8a] px-6 py-3.5 text-base font-semibold text-white transition hover:bg-[#16306f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a] focus-visible:ring-offset-2"
          >
            Download Membership Application Form
          </Link>
        </div>
      </section>

      <footer className="relative overflow-hidden border-t border-slate-200 bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,41,0.08) 1px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-12 text-base sm:px-6 lg:px-8">
          <p className="font-semibold text-[#0f1729]">P.O. Box 105-30100, Eldoret</p>
          <p>
            Contact: <a href="mailto:ugenyaassociationeldoret@gmail.com" className="text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]">ugenyaassociationeldoret@gmail.com</a>
          </p>
          <p className="text-slate-500">© {year} Ugenya Association Eldoret (UAE). All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
