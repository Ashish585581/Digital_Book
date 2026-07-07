import { BookOpen, Users, Feather } from 'lucide-react';

const STATS = [
  { icon: BookOpen, label: 'Books', value: '12,430', accent: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Users, label: 'Students', value: '5,320', accent: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Feather, label: 'Authors', value: '2,840', accent: 'text-amber-600', bg: 'bg-amber-50' },
];

export function Hero() {
  return (
    <div className="flex flex-col justify-center h-full px-12 py-16">
      {/* Heading */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]">
          <span className="text-emerald-600">Read.</span>{' '}
          <span className="text-slate-800">Learn.</span>{' '}
          <span className="text-amber-500">Grow.</span>
        </h1>
        <p className="mt-5 text-lg text-slate-500 max-w-md leading-relaxed">
          Your digital library for endless knowledge and discovery. Access thousands of books, from textbooks to timeless classics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {STATS.map(({ icon: Icon, label, value, accent, bg }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 backdrop-blur-sm p-5 text-center shadow-sm"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
