import { Navbar } from '@/components/auth/Navbar';
import { Hero } from '@/components/auth/Hero';
import { LoginCard } from '@/components/auth/LoginCard';
import { BackgroundDecoration } from '@/components/auth/BackgroundDecoration';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <BackgroundDecoration />
      <Navbar />

      {/* Main content */}
      <main className="relative z-10 flex min-h-screen">
        {/* Left side - Hero content (55%) */}
        <div className="hidden lg:flex lg:w-[55%] flex-col">
          <Hero />
        </div>

        {/* Right side - Login card (45%) */}
        <div className="w-full lg:w-[45%] flex items-center justify-center p-6 lg:p-12">
          <LoginCard />
        </div>
      </main>

      {/* Mobile hero - shown below login on small screens */}
      <div className="lg:hidden relative z-10 pb-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold">
            <span className="text-[#4F7DFF]">Read.</span>{' '}
            <span className="text-[#5FA36A]">Learn.</span>{' '}
            <span className="text-[#F4C542]">Grow.</span>
          </h1>
          <p className="text-[#6B7280] mt-3">
            BookLore is your digital library for endless knowledge and discovery.
          </p>
        </div>
      </div>
    </div>
  );
}
