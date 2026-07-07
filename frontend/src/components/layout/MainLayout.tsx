import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Sun, Moon, Menu, BookMarked } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

export function MainLayout() {
  const { user } = useAuthStore();
  const [dark, setDark] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [dark]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('topbar-search-input');
        if (el instanceof HTMLInputElement) el.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-secondary-bg">
      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Main column */}
      <div className="md:pl-[300px]">
        {/* Top navbar */}
        <motion.header
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-border/60 bg-background/80 px-5 backdrop-blur-md md:px-8"
        >
          {/* Mobile menu trigger */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 text-foreground transition-colors hover:bg-secondary-bg md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo (mobile only — desktop shows it in sidebar) */}
          <div className="flex items-center md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-gradient text-primary-foreground shadow-sm">
              <BookMarked className="h-4 w-4" />
            </div>
            <span className="ml-2 text-lg font-bold tracking-tight">BookLore</span>
          </div>

          {/* Centered search bar */}
          <div className="relative mx-auto w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="topbar-search-input"
              type="text"
              placeholder="Search books, authors, ISBN..."
              className="h-11 w-full rounded-xl border border-border bg-card pl-11 pr-16 text-sm text-foreground placeholder:text-muted-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border bg-secondary-bg px-2 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
              Ctrl K
            </kbd>
          </div>

          {/* Role badge - left accent */}
          <div
            className={cn(
              'hidden shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:flex',
              user?.role === 'admin'
                ? 'bg-indigo-50 text-indigo-600'
                : 'bg-blue-50 text-blue-600'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                user?.role === 'admin' ? 'bg-indigo-500' : 'bg-blue-500'
              )}
            />
            {user?.role === 'admin' ? 'Admin' : 'Student'}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1.5">
            {/* Notifications */}
            <button
              className="relative rounded-xl p-2.5 text-foreground transition-colors hover:bg-secondary-bg"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark((d) => !d)}
              className="rounded-xl p-2.5 text-foreground transition-colors hover:bg-secondary-bg"
              aria-label="Toggle dark mode"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={dark ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </motion.header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-5rem)] p-5 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer placeholder */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'h-full w-[280px] rounded-r-2xl bg-card p-4 shadow-xl'
              )}
            >
              <p className="px-3 py-6 text-sm font-semibold text-muted-foreground">
                Use the desktop layout for full navigation. Mobile drawer ships next.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
