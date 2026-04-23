import Link from "next/link";

export default function Register() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 pt-20 relative overflow-hidden">
    <div className="w-full max-w-5xl flex flex-col md:flex-row shadow-[0_20px_40px_rgba(0,36,51,0.06)] rounded-xl overflow-hidden bg-surface-container-lowest z-10 relative">
      <div className="hidden md:flex md:w-1/2 relative bg-primary-container p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZ7xiTNOAAi-ydiWmPoQMuC_Pv_W10Od3miIPHqy5_D-J0ek3bvPK_tB3N791XZcEcgTUT8uxL3TqBCtLvmrmZH1deklYp332y9ggR4s1z6pGbJAMUIO1Sm1U3tKO-msdtSUNGIbzsk8HmySIVNlQfMmZ4ZUBMf4QRLNVeRWO4XBAmzh6CEFDYYImiFqxJI1FPGs3Jiaq3qT0ObMsRYuobduyZ4_05U47eFqibXEkrY0ir9co4cvOx04do8jEnfn8aHOuvwEmi_v6d" 
            alt="University architecture" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay" 
          />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-tertiary-fixed text-4xl">account_balance</span>
            <span className="text-white font-headline font-black tracking-tighter text-2xl">NEU Curator</span>
          </div>
          <h2 className="text-white font-headline text-4xl font-extrabold leading-tight tracking-tight mb-4">
            The Academic <br /><span className="text-on-tertiary-container">Curator</span>
          </h2>
          <p className="text-primary-fixed-dim font-body text-lg max-w-xs">
            Institutional prestige meets digital clarity. Reimagining the knowledge hub for New Era University.
          </p>
        </div>
        <div className="relative z-10 mt-auto">
          <div className="flex gap-4 items-center">
            <div className="h-1 w-12 bg-on-tertiary-container rounded-full"></div>
            <span className="text-primary-fixed text-xs font-label uppercase tracking-widest">Est. 1975</span>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
        <div className="mb-10">
          <h1 className="text-primary-container font-headline font-black text-3xl tracking-tight mb-2">Register to Knowledge Board</h1>
        </div>
        
        <form className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[11px] font-label font-bold uppercase tracking-widest text-primary">Full Name</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-on-tertiary-container">person</span>
              <input 
                type="text" 
                placeholder="John Doe" 
                className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-on-tertiary-container transition-all" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-label font-bold uppercase tracking-widest text-primary">Email</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-on-tertiary-container">alternate_email</span>
              <input 
                type="email" 
                placeholder="john.doe@neu.edu.ph" 
                className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-on-tertiary-container transition-all" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-label font-bold uppercase tracking-widest text-primary">Password</label>
              <Link href="#" className="text-[10px] font-label font-bold text-on-tertiary-container hover:underline uppercase tracking-wider">Forgot?</Link>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-on-tertiary-container">lock</span>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3.5 bg-surface-container-low border-none rounded-lg text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-on-tertiary-container transition-all" 
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {/* Primary Login Button */}
            <button type="submit" className="w-full py-4 btn-tertiary text-on-tertiary font-headline font-bold rounded-lg shadow-[0_4px_12px_rgba(68,175,169,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2">
                Login
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>

            {/* Sign-in with Google Button */}
            <button type="button" className="w-full py-3 px-4 border border-outline-variant/30 bg-surface text-on-surface font-headline font-medium rounded-lg flex items-center justify-center gap-3 hover:bg-surface-container-low transition-all active:scale-95 shadow-sm">
                <svg xmlns="http://w3.org" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                <span>Sign in with Google</span>
             </button>

            {/* Inline Registration Link */}
            <p className="mt-2 text-center text-outline text-[11px] font-label uppercase tracking-widest">
                already have an account?{" "}
                <a href="/login" className="text-primary font-bold hover:underline transition-all">
                    Login
                </a>
            </p>
        </div>
        </form>
        
        <footer className="mt-12 flex justify-center items-center text-[12px] font-label font-medium text-outline uppercase tracking-widest">
          <div className="flex gap-4">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
          </div>
        </footer>
      </div>
    </div>
    </main>
  );
}