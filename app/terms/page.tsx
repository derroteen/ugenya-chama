import Link from "next/link";
import { Lora, Source_Sans_3 } from "next/font/google";
import PublicHeader from "../components/PublicHeader";

const displayFont = Lora({
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function TermsPage() {
  const year = new Date().getFullYear();

  return (
    <main className={`${bodyFont.className} min-h-screen bg-white text-[#475569]`}>
      <PublicHeader brandClassName={displayFont.className} />

      <section className="relative overflow-hidden bg-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden="true"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(15,23,41,0.08) 1px, transparent 1.5px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative mx-auto w-full max-w-4xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d3a8a]">Ugenya Association Eldoret (UAE) Member Portal</p>
          <h1 className={`${displayFont.className} mt-4 text-4xl font-bold leading-tight text-[#0f1729] sm:text-5xl`}>
            Terms &amp; Conditions and Privacy Policy
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-500">Last updated: July 2026</p>

          <article className="mt-10 space-y-10 text-base leading-8 sm:text-lg">
            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                1. Acceptance of Terms
              </h2>
              <p className="mt-3">
                By accessing and using the UAE Member Portal, you agree to be bound by these terms. If you do not agree, do not use the portal.
              </p>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                2. Who This Portal Is For
              </h2>
              <p className="mt-3">
                This portal is exclusively for registered members of Ugenya Association Eldoret and its authorised administrators. Access is granted only upon registration by the association&apos;s administration. Unauthorised access is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                3. Member Accounts
              </h2>
              <ul className="mt-3 space-y-2 list-disc pl-6 marker:text-[#c9a227]">
                <li>Your Member ID and login credentials are personal and must not be shared with anyone.</li>
                <li>You are responsible for all activity under your account.</li>
                <li>You must notify the association&apos;s administration immediately if you suspect unauthorised access to your account.</li>
                <li>The association reserves the right to suspend or revoke access for any breach of these terms.</li>
              </ul>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                4. Data You Can Access
              </h2>
              <p className="mt-3">
                As a member, you may only view your own contribution records, savings history, and emergency fund balance. You have no access to any other member&apos;s records. Administrators access records only within the scope of their assigned role.
              </p>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                5. Accuracy of Records
              </h2>
              <p className="mt-3">
                All contribution records are entered and managed by the association&apos;s administration. If you believe any entry in your records is incorrect, contact the association&apos;s administration directly at{" "}
                <a
                  href="mailto:ugenyaassociationeldoret@gmail.com"
                  className="text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                >
                  ugenyaassociationeldoret@gmail.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                6. Privacy Policy
              </h2>
              <p className="mt-1 text-base font-semibold text-[#1d3a8a] sm:text-lg">How We Handle Your Information</p>

              <div className="mt-4 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#0f1729]">6.1 What we collect</h3>
                  <p className="mt-2">
                    We collect your full name, Member ID, phone number, branch, and contribution records for the purpose of managing your membership with Ugenya Association Eldoret.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#0f1729]">6.2 How we use it</h3>
                  <p className="mt-2">
                    Your information is used solely to manage your membership, record your contributions, and provide you access to your own records through this portal. We do not sell, rent, or share your personal data with any third party outside the association.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#0f1729]">6.3 Who can see your data</h3>
                  <p className="mt-2">
                    Your personal records are visible only to you and to authorised administrators of the association. No other member can view your records.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#0f1729]">6.4 Data security</h3>
                  <p className="mt-2">
                    We implement role-based access controls and secure authentication to protect member data. Access to the portal requires valid credentials issued by the association&apos;s administration.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#0f1729]">6.5 Data retention</h3>
                  <p className="mt-2">
                    Your records are retained for as long as you remain a registered member of UAE. If your membership is terminated, your records may be retained for administrative purposes in accordance with the association&apos;s internal policies.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#0f1729]">6.6 Your rights</h3>
                  <p className="mt-2">
                    You have the right to request a correction of any inaccurate personal data held about you. Contact the administration at{" "}
                    <a
                      href="mailto:ugenyaassociationeldoret@gmail.com"
                      className="text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                    >
                      ugenyaassociationeldoret@gmail.com
                    </a>{" "}
                    to make such a request.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                7. Changes to These Terms
              </h2>
              <p className="mt-3">
                The association reserves the right to update these terms at any time. Changes will be reflected by an updated "Last updated" date on this page. Continued use of the portal after changes constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className={`${displayFont.className} text-2xl font-semibold text-[#0f1729] sm:text-3xl`}>
                8. Contact
              </h2>
              <div className="mt-3 space-y-1">
                <p>Ugenya Association Eldoret</p>
                <p>P.O. Box 195-30100, Eldoret</p>
                <p>
                  <a
                    href="mailto:ugenyaassociationeldoret@gmail.com"
                    className="text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
                  >
                    ugenyaassociationeldoret@gmail.com
                  </a>
                </p>
              </div>
            </section>
          </article>
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
          <p className="font-semibold text-[#0f1729]">P.O. Box 195-30100, Eldoret</p>
          <p>
            Contact:{" "}
            <a
              href="mailto:ugenyaassociationeldoret@gmail.com"
              className="text-[#1d3a8a] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
            >
              ugenyaassociationeldoret@gmail.com
            </a>
          </p>
          <p className="text-slate-500">
            © {year} Ugenya Association Eldoret (UAE). All rights reserved. {" "}
            <Link
              href="/terms"
              className="underline underline-offset-2 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d3a8a]"
            >
              Terms &amp; Privacy
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
