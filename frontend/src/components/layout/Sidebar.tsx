import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Library,
  Heart,
  BookOpen,
  Bookmark,
  Upload,
  Users,
  Folder,
  BarChart3,
  Settings,
  LogOut,
  BookMarked,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/cn';

type NavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Browse Books', href: '/library', icon: Library },
  { name: 'Favorites', href: '/favorites', icon: Heart },
  { name: 'Continue Reading', href: '/continue', icon: BookOpen },
  { name: 'Borrowed Books', href: '/borrowed', icon: Bookmark },
  { name: 'Upload Books', href: '/admin/upload', icon: Upload, adminOnly: true },
  { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  { name: 'Categories', href: '/categories', icon: Folder },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const filteredNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  return (
    <motion.aside
      initial={{ x: -32, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-5 top-5 bottom-5 z-40 hidden w-[280px] flex-col rounded-2xl bg-card shadow-lg md:flex"
    >
      {/* Logo */}
      <div className="flex items-center px-7 pt-7 pb-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-gradient text-primary-foreground shadow-md">
          <BookMarked className="h-5 w-5" />
        </div>
        <span className="ml-3 text-xl font-bold tracking-tight text-card-foreground">
          BookLore
        </span>
      </div>

      {/* Section label */}
      <div className="px-7 pt-6 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {filteredNav.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname === item.href ||
                  location.pathname.startsWith(item.href + '/');

            return (
              <motion.li
                key={item.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.08 + index * 0.03 }}
              >
                <Link
                  to={item.href}
                  className={cn(
                    'group relative flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary-bg hover:text-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'
                    )}
                  />
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.span
                      layoutId="active-pill"
                      className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-primary-foreground/80"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </nav>

      {/* Reading streak / quick actions card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="m-4 mt-2 rounded-2xl border bg-gradient-to-br from-primary/5 via-secondary-bg to-accent/5 p-4"
      >
        {/* Reading streak */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500 shadow-sm">
            <Flame className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">5 Day Streak</p>
            <p className="text-xs text-muted-foreground">Keep reading!</p>
          </div>
          <span className="text-xs font-semibold text-amber-500">🔥 ×5</span>
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-border/60" />

        {/* Quick links */}
        <div className="space-y-1">
          <Link
            to="/settings"
            className="flex items-center justify-between rounded-lg px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </motion.div>
    </motion.aside>
  );
}
