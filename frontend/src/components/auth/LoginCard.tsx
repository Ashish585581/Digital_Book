import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Loader2 } from 'lucide-react';

type Role = 'student' | 'admin';

export function LoginCard() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [role, setRole] = useState<Role>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password, role);
      navigate('/');
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-xl shadow-slate-200/50 p-8">
        {/* Header */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue reading</p>
        </div>

        {/* Role Toggle */}
        <div className="mb-6">
          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Login as</Label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            {(['student', 'admin'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 capitalize ${
                  role === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r === 'student' ? 'Student' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Register link */}
        <p className="mt-5 text-center text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
            Contact your administrator
          </Link>
        </p>
      </div>
    </div>
  );
}
