import Link from "next/link";
import Image from "next/image";

export default function TermsOfService() {
  return (
    <main className="flex-1 bg-surface-container-low p-6 md:p-8 pt-12 md:pt-24 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 flex justify-between items-center bg-[#053B50] rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3">
            <Image src="/navibyte-logo-v2.svg" alt="Navibyte Logo" width={40} height={40} className="drop-shadow-md" />
            <span className="text-xl font-black text-white tracking-[-2%] font-headline drop-shadow-md">
              Navibyte KB
            </span>
          </div>
        </header>

        <header className="mb-8 flex justify-between items-end px-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-tertiary-container bg-tertiary-fixed px-2 py-1 rounded mb-4 inline-block">Legal Directory / Policies</span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-primary mb-2">Terms of Service &amp;<br/>Operational Mandates</h1>
            <p className="text-on-surface-variant font-medium mt-4">
              Governing the collection, retention, and systematic disposal of physical and digital artifacts within the Navibyte KB ecosystem. Last updated May, 2026.
            </p>
          </div>
        </header>

        <article className="bg-surface-container-lowest rounded-xl p-8 md:p-12 shadow-sm mb-12">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3 pb-4 border-b border-surface-container">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              1. Thirty-Day Retention Lifecycle
            </h2>
            <div className="text-on-surface-variant text-sm space-y-6">
              <p className="leading-relaxed">
                Navibyte KB enforces a strict thirty-day retention policy to prevent physical storage drift and maintain digital database integrity. All items logged into the system are subject to this lifecycle mandate, beginning precisely at the timestamp of initial intake.
              </p>
              <ul className="list-none space-y-4 ml-2">
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5 text-[20px]">check_circle</span>
                  <div>
                    <strong className="text-primary block mb-1">Physical Artifacts</strong>
                    Found items stored in designated department bins will be held for exactly 30 calendar days. After this period, items are classified as "Abandoned" and transferred to central processing for donation or disposal.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary-container mt-0.5 text-[20px]">check_circle</span>
                  <div>
                    <strong className="text-primary block mb-1">Digital Records</strong>
                    Associated metadata, including unverified claim tickets and high-resolution intake imagery, will be purged from the active database to comply with institutional data minimization standards.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">warning</span>
                  <div>
                    <strong className="text-error block mb-1">Immediate Disposal Clause</strong>
                    Items exceeding this limit, or items deemed hazardous/perishable upon initial inspection, are subject to immediate disposal without prior notification to the potential claimant.
                  </div>
                </li>
              </ul>
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3 pb-4 border-b border-surface-container">
              <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
              2. Administrative Access
            </h2>
            <div className="text-on-surface-variant text-sm space-y-4">
              <p className="leading-relaxed">
                Access to the Curator Logs and Archive Management features is restricted to authorized personnel holding verified institutional credentials. 
              </p>
            </div>
          </section>
        </article>

        <div className="flex justify-start px-4 pb-12">
          <Link href="/login" className="inline-flex bg-[#0d6682] text-white px-8 py-3 rounded-md text-sm font-extrabold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-secondary/20 transition-all active:scale-95 items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}
