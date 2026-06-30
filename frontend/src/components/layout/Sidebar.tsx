import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Upload, Users, Settings, LogOut, Library } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';

const navigation = [
  { name: 'Library', href: '/', icon: Library },
  { name: 'Upload', href: '/admin/upload', icon: Upload, adminOnly: true },
  { name: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const isAdmin = user?.role === 'admin';

  const filteredNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <BookOpen className="mr-2 h-6 w-6 text-primary" />
        <span className="text-xl font-bold">BookLore</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="mb-3 flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}