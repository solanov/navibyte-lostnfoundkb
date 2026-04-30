import EntryForm from '@/src/components/pages/EntryForm';
import Link from 'next/link';

export default function CreateEntryPage() {
  return (
    <div className="bg-background text-foreground min-h-screen font-body selection:bg-primary-fixed selection:text-primary">
      <main className="flex flex-col items-center justify-center p-8 pt-32 pb-24 min-h-screen">
        <div className="w-full max-w-2xl mb-6">
          <Link href="/board" className="text-primary hover:underline font-bold text-sm flex items-center gap-2 w-fit group">
            <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
            Back to Board
          </Link>
        </div>
        <EntryForm />
      </main>
    </div>
  );
}
