import Link from "next/link";

export default function RegisterSuccess() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 pt-20 bg-[#EEEEEE]">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(5,59,80,0.12)] overflow-hidden">
          <div className="h-2 w-full bg-[#64CCC5]" />

          <div className="p-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#64CCC5]/10 border-2 border-[#64CCC5]/30 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[#64CCC5] text-4xl">mark_email_read</span>
            </div>

            <h1 className="text-[#053B50] font-headline font-black text-3xl tracking-tight mb-3">
              Registration Complete!
            </h1>

            <p className="text-gray-500 font-body text-base leading-relaxed max-w-sm mb-6">
              Your NEU account has been successfully created. We&apos;ve sent a verification email to your inbox.
            </p>

            <div className="w-full p-5 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-start gap-3 mb-8 text-left">
              <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5 shrink-0">schedule</span>
              <div>
                <p className="text-amber-800 font-headline font-bold text-sm mb-1">Email Verification Pending</p>
                <p className="text-amber-700 font-body text-sm leading-relaxed">
                  Please check your <strong>@neu.edu.ph</strong> inbox and click the confirmation link. This process may take up to <strong>24 hours</strong>.
                </p>
              </div>
            </div>

            <div className="w-full space-y-3">
              <Link
                id="back-to-login-btn"
                href="/login"
                className="w-full py-4 bg-[#64CCC5] hover:bg-[#4fb8b1] active:scale-[0.98] text-white font-headline font-bold rounded-xl shadow-[0_4px_20px_rgba(100,204,197,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Login
              </Link>
            </div>
          </div>

          <div className="px-10 pb-8 flex justify-center gap-4 text-[11px] font-label font-medium text-gray-400 uppercase tracking-widest">
            <Link href="#" className="hover:text-[#053B50] transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="#" className="hover:text-[#053B50] transition-colors">Terms</Link>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-400 text-[11px] font-label uppercase tracking-widest">
          New Era University &mdash; Est. 1975
        </p>
      </div>
    </main>
  );
}
