import Link from "next/link";
import Image from "next/image";

export default function PrivacyPolicy() {
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

        <article className="bg-surface-container-lowest rounded-xl p-8 md:p-16 shadow-[0_20px_40px_rgba(0,36,51,0.06)] outline outline-1 outline-outline-variant/15 relative overflow-hidden">
          <div className="relative z-10">
            <header className="mb-12 border-b border-surface-container pb-8">
              <span className="font-label text-sm uppercase tracking-[0.05em] text-on-surface-variant font-bold mb-4 block">Legal Directory</span>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold text-primary tracking-tighter mb-4">Institutional Privacy Policy</h1>
              <p className="font-body text-on-surface-variant text-sm">Last Updated: May 2026</p>
            </header>
            <div className="prose prose-slate max-w-none text-on-surface-variant font-body leading-relaxed space-y-8">
              <section>
                <h2 className="font-headline text-2xl font-bold text-primary mb-4 tracking-tight">1. Collection of Unredacted Asset Data</h2>
                <p className="mb-4">
                  In accordance with the SECI Knowledge Framework, Navibyte KB platform securely stores detailed, unredacted records of institutional assets. This includes, but is not limited to, "Hidden Notes," internal provenance records, and high-resolution, unredacted imagery necessary for staff verification and historical accuracy.
                </p>
                <p>
                  Access to these unredacted layers is strictly limited to authorized curatorial staff and administrative personnel. The system employs rigorous access control lists (ACLs) to ensure that public-facing views automatically redact sensitive information, preserving both historical integrity and necessary privacy protocols.
                </p>
              </section>
              <section>
                <h2 className="font-headline text-2xl font-bold text-primary mb-4 tracking-tight">2. Data Retention and Archival Standards</h2>
                <p>
                  Asset records are maintained in perpetuity as part of the institutional digital archive. While administrative logs (e.g., user login history, specific access queries) are subject to a rolling 36-month retention policy, the core metadata and associated unredacted imagery of curated items are preserved indefinitely to support longitudinal academic research.
                </p>
              </section>
              <section>
                <h2 className="font-headline text-2xl font-bold text-primary mb-4 tracking-tight">3. Third-Party Research Access</h2>
                <p>
                  External researchers may request temporary, scoped access to specific asset subsets. Such requests are processed through the formal Archival Management board. Under no circumstances is personally identifiable information (PII) of original donors or staff released to third-party researchers without explicit, documented consent and appropriate redaction layers applied by the system.
                </p>
              </section>
            </div>
            <div className="mt-16 pt-8 border-t border-surface-container flex justify-start">
              <Link href="/login" className="inline-flex items-center gap-2 bg-[#0d6682] text-white px-8 py-3 rounded-md text-sm font-extrabold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-secondary/20 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Login
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
