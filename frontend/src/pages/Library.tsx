import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  BookText,
  Library,
  Clock,
  ChevronRight,
  BookMarked,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowRight,
  Bookmark,
  Star,
  TrendingUp,
  Users,
  Download,
  Timer,
  Play,
  Flame,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import { progressApi } from '@/api/progress';
import { booksApi } from '@/api/books';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { CLASS_GRADE_OPTIONS, Book } from '@/types/book';
import { formatFileSize } from '@/utils/cn';

const SCHOOL_CATEGORIES = ['Textbooks', 'Notes', 'Assignments', 'Question Papers', 'Study Material'];
const PUBLIC_CATEGORIES = ['Novels', 'Stories', 'Science', 'History', 'Technology', 'Biography', 'Self Help'];

interface ContinueReadingItem extends Book {
  progress_percent: number;
}

const HERO_STATS = [
  { label: 'Books', value: '12,430', trend: '+32 this week', icon: BookOpen },
  { label: 'Students', value: '5,320', trend: '+18 this week', icon: Users },
  { label: 'Borrowed', value: '1,420', trend: '+7 today', icon: BookMarked },
  { label: 'Downloads', value: '53K', trend: '+892 this week', icon: Download },
];

const QUICK_STATS = [
  { label: 'Books Added', value: '+147', trend: 'this week', icon: TrendingUp, accent: 'text-emerald-600 bg-emerald-50' },
  { label: 'Active Students', value: '3,284', trend: 'online now', icon: Users, accent: 'text-blue-600 bg-blue-50' },
  { label: 'Downloads', value: '8,721', trend: 'this week', icon: Download, accent: 'text-amber-600 bg-amber-50' },
  { label: 'Reading Hours', value: '12.4K', trend: 'this week', icon: Timer, accent: 'text-rose-600 bg-rose-50' },
];

import type { Variants } from 'framer-motion';

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const heroFade: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO },
  },
};

const heroStagger: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const statItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

const sectionFade: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE_OUT_EXPO, when: 'beforeChildren', staggerChildren: 0.06 },
  },
};

const cardLift = {
  rest: { y: 0, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)' },
  hover: { y: -4, boxShadow: '0 12px 24px -6px rgb(0 0 0 / 0.10), 0 4px 10px -4px rgb(0 0 0 / 0.06)' },
};

const bookCardLift = {
  rest: { y: 0, boxShadow: '0 2px 8px -2px rgb(0 0 0 / 0.06), 0 1px 3px -1px rgb(0 0 0 / 0.04)' },
  hover: { y: -8, boxShadow: '0 24px 40px -10px rgb(0 0 0 / 0.12), 0 8px 16px -6px rgb(0 0 0 / 0.06)' },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function LibraryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { books, total, page, pages, isLoading, filters, fetchBooks, setFilters } = useBookStore();

  const [search, setSearch] = useState('');
  const [classGrade, setClassGrade] = useState<string>('');
  const [bookType, setBookType] = useState<string>('');
  const [libraryView, setLibraryView] = useState<'all' | 'school' | 'public'>('all');
  const [continueReading, setContinueReading] = useState<ContinueReadingItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'created_at' | 'authors'>('created_at');

  useEffect(() => {
    fetchBooks();
    fetchContinueReading();
  }, []);

  const fetchContinueReading = async () => {
    try {
      const progressData = await progressApi.getAllProgress();
      const items: ContinueReadingItem[] = [];
      for (const p of progressData.items.slice(0, 6)) {
        try {
          const book = await booksApi.getBook(p.book_id);
          items.push({ ...book, progress_percent: p.progress_percent });
        } catch {
          // Book may have been deleted
        }
      }
      setContinueReading(items);
    } catch (err) {
      console.error('Failed to fetch continue reading:', err);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: search || undefined,
      class_grade: classGrade || undefined,
      book_type: (bookType as 'PDF' | 'EPUB') || undefined,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleLibraryTypeSelect = (type: 'all' | 'school' | 'public') => {
    setLibraryView(type);
    if (type === 'school') {
      setClassGrade('');
    } else if (type === 'public') {
      setClassGrade('General');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl space-y-10 px-6 py-8">
          {/* ─── Hero Section ─── */}
          <motion.section
            initial="hidden"
            animate="show"
            variants={heroFade}
            className="relative overflow-hidden rounded-card border bg-gradient-to-r from-primary/10 via-secondary-bg to-transparent"
            style={{ minHeight: 280 }}
          >
            <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-5 md:gap-8 md:p-10">
              {/* Left — 3/5 width */}
              <div className="flex flex-col justify-between md:col-span-3">
                <motion.div initial="hidden" animate="show" variants={heroStagger}>
                  <motion.div variants={statItem} className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Your reading home</span>
                  </motion.div>

                  <motion.h1 variants={statItem} className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                    {getGreeting()}, {user?.name?.split(' ')[0]}
                    <span className="ml-2 text-primary">.</span>
                  </motion.h1>

                  <motion.p variants={statItem} className="mt-3 max-w-md text-base text-muted-foreground">
                    Continue your reading journey. Pick up where you left off, explore curated collections, and discover your next favorite book.
                  </motion.p>

                  <motion.div variants={statItem} className="mt-6 flex flex-wrap gap-3">
                    <Button
                      size="lg"
                      onClick={() => {
                        const el = document.getElementById('browse-books');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <Library className="mr-2 h-4 w-4" />
                      Explore Library
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        const el = document.getElementById('quick-stats');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Stats row with trends */}
                <motion.div initial="hidden" animate="show" variants={heroStagger} className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {HERO_STATS.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        variants={statItem}
                        className="flex items-center gap-2.5 rounded-xl border bg-card/70 px-3 py-2.5 backdrop-blur"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold leading-none text-foreground">{stat.value}</p>
                          <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">{stat.label}</p>
                          <p className="mt-0.5 text-[10px] font-medium leading-none text-emerald-600">{stat.trend}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Right — 2/5 width: mini illustration + Continue Reading card */}
              <div className="flex flex-col gap-4 md:col-span-2">
                {/* Small illustration */}
                <div className="relative flex items-center justify-center opacity-60">
                  <svg viewBox="0 0 280 100" className="w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                    <defs>
                      <linearGradient id="heroGradSmall" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary) / 0.15)" />
                        <stop offset="100%" stopColor="hsl(var(--accent) / 0.10)" />
                      </linearGradient>
                    </defs>
                    <rect x="80" y="40" width="120" height="55" rx="5" fill="hsl(var(--card))" stroke="hsl(var(--border))" />
                    <rect x="87" y="47" width="106" height="41" rx="2" fill="url(#heroGradSmall)" />
                    <rect x="70" y="93" width="140" height="7" rx="3" fill="hsl(var(--muted))" />
                    <rect x="20" y="68" width="50" height="10" rx="2" fill="hsl(var(--accent) / 0.55)" />
                    <rect x="22" y="58" width="45" height="10" rx="2" fill="hsl(var(--warning) / 0.60)" />
                    <rect x="26" y="48" width="40" height="10" rx="2" fill="hsl(var(--primary) / 0.70)" />
                    <ellipse cx="248" cy="88" rx="18" ry="5" fill="hsl(var(--success) / 0.20)" />
                    <rect x="237" y="70" width="22" height="20" rx="5" fill="hsl(var(--success) / 0.55)" />
                  </svg>
                </div>

                {/* Continue Reading card (most recent book) */}
                {continueReading.length > 0 && (
                  <motion.div variants={statItem} className="rounded-xl border bg-card/95 p-4 shadow-md backdrop-blur">
                    <div className="mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" strokeWidth={2} />
                      <p className="text-xs font-semibold text-muted-foreground">Continue Reading</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-inner">
                        {continueReading[0].thumbnail ? (
                          <img src={continueReading[0].thumbnail} alt={continueReading[0].title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground line-clamp-1">{continueReading[0].title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{continueReading[0].authors}</p>
                        <div className="mt-2">
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${continueReading[0].progress_percent}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] text-muted-foreground">{continueReading[0].progress_percent}% complete</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate(`/books/${continueReading[0].id}`)}>
                        <Play className="mr-1 h-3.5 w-3.5" />
                        Resume
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.section>

          {/* ─── Category Cards ─── */}
          <motion.section initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={sectionFade}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <motion.button
                variants={statItem}
                initial="rest"
                whileHover="hover"
                animate="rest"
                onClick={() => handleLibraryTypeSelect('all')}
                className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-xl border bg-card p-6 text-left transition-colors ${
                  libraryView === 'all' ? 'border-primary ring-1 ring-primary/20' : 'hover:border-primary/40'
                }`}
              >
                <motion.div variants={cardLift} className="absolute inset-0 rounded-xl pointer-events-none" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Library className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <div className="relative flex-1">
                  <h3 className="text-lg font-semibold text-foreground">All Books</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Every book in the library across all categories.
                  </p>
                  <p className="mt-3 text-2xl font-bold text-foreground">{total.toLocaleString()}</p>
                </div>
                <div className="relative mt-2 inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </motion.button>

              <motion.button
                variants={statItem}
                initial="rest"
                whileHover="hover"
                animate="rest"
                onClick={() => handleLibraryTypeSelect('school')}
                className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-xl border bg-card p-6 text-left transition-colors ${
                  libraryView === 'school' ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'hover:border-emerald-500/40'
                }`}
              >
                <motion.div variants={cardLift} className="absolute inset-0 rounded-xl pointer-events-none" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BookText className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <div className="relative flex-1">
                  <h3 className="text-lg font-semibold text-foreground">School Library</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Textbooks, notes, assignments & study material.
                  </p>
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {SCHOOL_CATEGORIES.length} <span className="text-sm font-medium text-muted-foreground">categories</span>
                  </p>
                </div>
                <div className="relative mt-2 inline-flex items-center text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </motion.button>

              <motion.button
                variants={statItem}
                initial="rest"
                whileHover="hover"
                animate="rest"
                onClick={() => handleLibraryTypeSelect('public')}
                className={`group relative flex flex-col items-start gap-4 overflow-hidden rounded-xl border bg-card p-6 text-left transition-colors ${
                  libraryView === 'public' ? 'border-amber-500 ring-1 ring-amber-500/20' : 'hover:border-amber-500/40'
                }`}
              >
                <motion.div variants={cardLift} className="absolute inset-0 rounded-xl pointer-events-none" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <BookMarked className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <div className="relative flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Public Library</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Novels, stories, science, history & biographies.
                  </p>
                  <p className="mt-3 text-2xl font-bold text-foreground">
                    {PUBLIC_CATEGORIES.length} <span className="text-sm font-medium text-muted-foreground">categories</span>
                  </p>
                </div>
                <div className="relative mt-2 inline-flex items-center text-sm font-medium text-amber-600 group-hover:gap-2 transition-all">
                  Explore <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </motion.button>
            </div>
          </motion.section>

          {/* ─── Quick Stats ─── */}
          <motion.section
            id="quick-stats"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionFade}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {QUICK_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    variants={statItem}
                    className="rounded-xl border bg-card p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.accent}`}>
                        <Icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ─── Continue Reading ─── */}
          {continueReading.length > 0 && (
            <motion.section
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              variants={sectionFade}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" strokeWidth={2} />
                  <h3 className="text-lg font-semibold text-foreground">Continue Reading</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {continueReading.map((book) => (
                  <motion.div key={book.id} variants={statItem}>
                    <Link
                      to={`/books/${book.id}`}
                      className="group block rounded-xl border bg-card p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted">
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <h4 className="line-clamp-1 text-sm font-semibold text-foreground">{book.title}</h4>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{book.authors}</p>
                        <div className="mt-2">
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${book.progress_percent}%` }} />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{book.progress_percent}% complete</span>
                          </div>
                        </div>
                        <Button size="sm" className="mt-3 w-full" variant="outline" onClick={() => navigate(`/books/${book.id}`)}>
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Resume
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ─── Featured Books ─── */}
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={sectionFade}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" strokeWidth={2} />
                <h3 className="text-lg font-semibold text-foreground">Featured Books</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {books.slice(0, 4).map((book) => (
                <motion.div
                  key={book.id}
                  variants={statItem}
                  initial="rest"
                  whileHover="hover"
                  animate="rest"
                  className="group"
                >
                  <Link to={`/books/${book.id}`}>
                    <motion.div variants={bookCardLift} className="overflow-hidden rounded-xl border bg-card">
                      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={book.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-secondary-bg">
                            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => e.preventDefault()}
                          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
                          aria-label="Bookmark"
                        >
                          <Bookmark className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h4 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">{book.title}</h4>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{book.authors}</p>
                        <div className="mt-2 flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5" fill={i < 4 ? 'currentColor' : 'none'} strokeWidth={1.5} />
                          ))}
                          <span className="ml-1 text-xs text-muted-foreground">4.0</span>
                        </div>
                        <Button size="sm" className="mt-3 w-full">
                          <BookMarked className="mr-1.5 h-3.5 w-3.5" />
                          Borrow
                        </Button>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── Browse Books ─── */}
          <motion.section
            id="browse-books"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={sectionFade}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">Browse Books</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[160px] bg-card">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Recently Added</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="authors">Author</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex rounded-lg border bg-card">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                <Select value={classGrade} onValueChange={setClassGrade}>
                  <SelectTrigger className="w-[150px] bg-card">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {CLASS_GRADE_OPTIONS.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={bookType} onValueChange={setBookType}>
                  <SelectTrigger className="w-[120px] bg-card">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EPUB">EPUB</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            {/* Category chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {libraryView !== 'public' &&
                SCHOOL_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFilters({ ...filters, search: category, page: 1 })}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      filters.search === category
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              {libraryView !== 'school' &&
                PUBLIC_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => { setFilters({ ...filters, search: category, page: 1 }); setSearch(category); }}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      filters.search === category
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'bg-card text-muted-foreground hover:border-amber-500/40 hover:text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                ))}
            </div>

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
                    <div className="aspect-[3/4] rounded-lg bg-muted" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
                    <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
                    <div className="mt-3 h-8 w-full rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card">
                <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No books found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or upload some books.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Showing {books.length} of {total} books
                </div>
                {viewMode === 'grid' ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {books.map((book) => (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        className="group rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-lg hover:border-primary/30"
                      >
                        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-muted shadow-inner">
                          {book.thumbnail ? (
                            <img src={book.thumbnail} alt={book.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="mt-4">
                          <h3 className="font-semibold line-clamp-2 group-hover:text-primary">{book.title}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">{book.authors}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{book.class_grade}</span>
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{book.book_type}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(book.file_size)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {books.map((book) => (
                      <Link
                        key={book.id}
                        to={`/books/${book.id}`}
                        className="group flex items-center gap-4 rounded-xl border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
                      >
                        <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted shadow-inner">
                          {book.thumbnail ? (
                            <img src={book.thumbnail} alt={book.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold line-clamp-1 group-hover:text-primary">{book.title}</h3>
                          <p className="text-sm text-muted-foreground">{book.authors}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{book.class_grade}</span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{book.book_type}</span>
                          <span className="text-xs text-muted-foreground">{formatFileSize(book.file_size)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>Previous</Button>
                    <span className="px-4 text-sm text-muted-foreground">Page {page} of {pages}</span>
                    <Button variant="outline" onClick={() => handlePageChange(page + 1)} disabled={page >= pages}>Next</Button>
                  </div>
                )}
              </>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}
