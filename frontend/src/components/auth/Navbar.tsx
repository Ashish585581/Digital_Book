import { BookOpen } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
          <BookOpen className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">BookLore</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">Digital Library</span>
      </div>
    </nav>
  );
}
