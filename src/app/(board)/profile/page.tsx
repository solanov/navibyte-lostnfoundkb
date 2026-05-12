import Sidebar from '@/src/components/layout/SideNav';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />

      <main className="flex-1 bg-[#fbf9f8] p-4 md:pt-16 md:pl-16 md:pr-12 pt-20 min-w-0 transition-all duration-300">
        <div className="w-full max-w-4xl">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight text-[#002433] font-headline">
              My Profile
            </h1>
            <p className="text-[#41484c] text-sm font-medium mt-1">
              Your account information and all posts you&apos;ve submitted.
            </p>
          </div>

          <ProfileClient />

        </div>
      </main>
    </div>
  );
}
