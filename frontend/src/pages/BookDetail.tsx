import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Edit,
  Trash2,
  Play,
  Clock,
  FileText,
  Calendar,
  HardDrive,
  ChevronRight,
  Home,
  PenLine,
  Download,
  Bookmark,
  Share2,
  Star,
  Eye,
  Building2,
  Languages,
  Hash,
  Check,
} from 'lucide-react';
import { useBookStore } from '@/stores/bookStore';
import { useAuthStore } from '@/stores/authStore';
import { progressApi } from '@/api/progress';
import { booksApi } from '@/api/books';
import { Button } from '@/components/common/Button';
import { cn, formatFileSize, formatDate } from '@/utils/cn';
import { Book } from '@/types/book';
import { ReadingProgress } from '@/types/progress';

const FADE_IN = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function RatingStars({ value = 0, total = 5 }: { value?: number; total?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <Star
            key={i}
            className={cn(
              'h-4 w-4 transition-colors',
              filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
            )}
          />
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-text-secondary">{value.toFixed(1)}</span>
      )}
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const size = 88;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="hsl(var(--muted))"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          stroke="url(#progressGradient)"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary-gradient-start))" />
            <stop offset="100%" stopColor="hsl(var(--primary-gradient-end))" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute text-lg font-bold text-foreground">{safePercent}%</span>
    </div>
  );
}

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBook, fetchBook, deleteBook, isLoading } = useBookStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [isFetchingProgress, setIsFetchingProgress] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBook(Number(id));
    }
  }, [id, fetchBook]);

  useEffect(() => {
    if (currentBook && id) {
      fetchProgress(Number(id));
      fetchRelatedBooks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBook?.id]);

  const fetchProgress = async (bookId: number) => {
    setIsFetchingProgress(true);
    try {
      const p = await progressApi.getProgress(bookId);
      setProgress(p);
    } catch {
      setProgress(null);
    } finally {
      setIsFetchingProgress(false);
    }
  };

  const fetchRelatedBooks = async () => {
    if (!currentBook) return;
    try {
      const result = await booksApi.listBooks({
        class_grade: currentBook.class_grade,
        limit: 5,
      });
      setRelatedBooks(result.items.filter((b) => b.id !== currentBook.id).slice(0, 4));
    } catch {
      setRelatedBooks([]);
    }
  };

  const handleRead = () => {
    if (currentBook) {
      navigate(`/read/${currentBook.id}`);
    }
  };

  const handleContinueReading = () => {
    if (currentBook) {
      navigate(`/read/${currentBook.id}`);
    } else {
      handleRead();
    }
  };

  const handleDelete = async () => {
    if (id && window.confirm('Are you sure you want to delete this book?')) {
      await deleteBook(Number(id));
      navigate('/');
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: currentBook?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1800);
      }
    } catch {
      // user cancelled share
    }
  };

  if (isLoading || !currentBook) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading book details...</p>
        </div>
      </div>
    );
  }

  const ratingValue = 4;
  const fullDescription = `Immerse yourself in ${currentBook.title}, a remarkable work by ${currentBook.authors}. This ${currentBook.book_type} edition offers readers a beautifully formatted experience with crystal-clear typography and thoughtful pacing. Whether you're reading for study, leisure, or research, every chapter invites deeper engagement with the author's distinctive voice and perspective.`;
  const shortDescription = fullDescription.slice(0, 180) + (fullDescription.length > 180 ? '…' : '');

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Top header bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-card/80 px-6 py-4 shadow-sm backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} aria-label="Back">
          <Home className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold">Book Details</h1>
        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={STAGGER}
          className="space-y-8"
        >
          {/* Breadcrumb */}
          <motion.nav
            variants={FADE_IN}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center gap-1.5 text-sm text-text-secondary"
            aria-label="Breadcrumb"
          >
            <Link to="/" className="flex items-center gap-1 transition-colors hover:text-primary">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <Link to="/" className="transition-colors hover:text-primary">
              Books
            </Link>
            <ChevronRight className="h-4 w-4 opacity-50" />
            <span className="font-medium text-foreground line-clamp-1">{currentBook.title}</span>
          </motion.nav>

          {/* Hero: two-column layout */}
          <motion.div
            variants={FADE_IN}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="grid gap-8 lg:grid-cols-12 lg:gap-10"
          >
            {/* Left: Cover (40%) */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                <div className="group relative mx-auto max-w-sm overflow-hidden rounded-2xl bg-card shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="aspect-[3/4] bg-muted transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                    {currentBook.thumbnail ? (
                      <img
                        src={currentBook.thumbnail}
                        alt={currentBook.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary-bg to-muted">
                        <BookOpen className="h-24 w-24 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-foreground/80 px-3 py-1 text-xs font-medium text-background backdrop-blur">
                    {currentBook.book_type}
                  </div>
                </div>
                {/* Quick meta under cover */}
                <div className="mx-auto flex max-w-sm items-center justify-around rounded-2xl border bg-card p-3 shadow-sm">
                  <div className="flex flex-col items-center px-3">
                    <FileText className="mb-1 h-4 w-4 text-primary" />
                    <span className="text-xs text-text-secondary">{currentBook.book_type}</span>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex flex-col items-center px-3">
                    <HardDrive className="mb-1 h-4 w-4 text-primary" />
                    <span className="text-xs text-text-secondary">{formatFileSize(currentBook.file_size)}</span>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex flex-col items-center px-3">
                    <Calendar className="mb-1 h-4 w-4 text-primary" />
                    <span className="text-xs text-text-secondary">{formatDate(currentBook.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Book info (60%) */}
            <div className="space-y-6 lg:col-span-7">
              {/* Title block */}
              <div className="space-y-3">
                <h1 className="text-[32px] font-bold leading-tight tracking-tight text-foreground">
                  {currentBook.title}
                </h1>
                <div className="flex items-center gap-2 text-lg text-text-secondary">
                  <PenLine className="h-4 w-4" />
                  <span>{currentBook.authors}</span>
                </div>
                <RatingStars value={ratingValue} />
              </div>

              {/* Tags row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                  {currentBook.class_grade}
                </span>
                <span className="rounded-full border bg-card px-3 py-1 text-sm font-medium text-foreground">
                  {currentBook.book_type}
                </span>
                <span className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm font-medium text-text-secondary">
                  <HardDrive className="h-3.5 w-3.5" />
                  {formatFileSize(currentBook.file_size)}
                </span>
              </div>

              {/* Action buttons row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  size="lg"
                  className="rounded-xl px-7 text-base shadow-md"
                  onClick={progress ? handleContinueReading : handleRead}
                >
                  {progress ? (
                    <>
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      Continue Reading
                    </>
                  ) : (
                    <>
                      <BookOpen className="mr-2 h-5 w-5" />
                      Start Reading
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-6 text-base"
                  onClick={() => window.open(currentBook.thumbnail ?? '#', '_blank')}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl"
                    aria-label="Bookmark"
                  >
                    <Bookmark className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl"
                    onClick={handleShare}
                    aria-label="Share"
                  >
                    {isCopied ? (
                      <Check className="h-5 w-5 text-success" />
                    ) : (
                      <Share2 className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress card */}
              {progress && (
                <div className="flex items-center gap-5 rounded-2xl border bg-card p-5 shadow-sm">
                  <ProgressRing percent={progress.progress_percent} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      Reading Progress
                    </div>
                    {progress.last_read_at && (
                      <p className="text-sm text-text-secondary">
                        Last read <span className="font-medium text-foreground">{formatDate(progress.last_read_at)}</span>
                      </p>
                    )}
                    {progress.progress_percent > 0 && progress.progress_percent < 100 && (
                      <p className="text-xs text-text-secondary">
                        Pick up where you left off and continue your journey.
                      </p>
                    )}
                    {progress.progress_percent >= 100 && (
                      <p className="text-xs font-medium text-success">You've finished this book.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Description card */}
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-bold">About this book</h3>
                <p className="text-sm leading-relaxed text-text-secondary">
                  {isDescriptionExpanded ? fullDescription : shortDescription}
                </p>
                {fullDescription.length > 180 && (
                  <button
                    onClick={() => setIsDescriptionExpanded((v) => !v)}
                    className="mt-3 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                  >
                    {isDescriptionExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>

              {/* Metadata 2x2 */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                      Publisher
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      BookLore Press
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Languages className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                      Language
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      English
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                      Pages
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      {currentBook.book_type === 'PDF' ? '248 pages' : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Hash className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                      ISBN
                    </p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                      978-0-00-000000-0
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Related Books — horizontal scroll */}
          {relatedBooks.length > 0 && (
            <motion.section
              variants={FADE_IN}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Related Books</h3>
                </div>
                <span className="text-sm text-text-secondary">
                  More from {currentBook.class_grade}
                </span>
              </div>
              <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2 [scrollbar-width:thin]">
                {relatedBooks.map((book) => (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    className="group flex w-56 flex-shrink-0 flex-col rounded-xl border bg-card p-3 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
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
                          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex-1 space-y-1">
                      <h4 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
                        {book.title}
                      </h4>
                      <p className="line-clamp-1 text-xs text-text-secondary">{book.authors}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {book.class_grade}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}
        </motion.div>
      </main>
    </div>
  );
}
