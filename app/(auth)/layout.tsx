import { GoldStrip, Logo } from '@/components/brand/Logo';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <GoldStrip />
      <header className="px-8 py-5 border-b border-border bg-[#0A0A0A]">
        <div className="max-w-[1160px] mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Sprint 2 · Auth
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
      <footer className="border-t border-border bg-[#0A0A0A] px-8 py-5 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        Nexus · YALLO AI Academy build
      </footer>
    </div>
  );
}
