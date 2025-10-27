'use client';

import { useState, type ReactNode, MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type NavKey = 'feed' | 'plans' | 'groups' | 'profile';

type PrimaryAction = {
  label: string;
  href: string;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
};

type PrimaryHeaderProps = {
  active?: NavKey;
  subtitle?: string;
  containerClassName?: string;
  primaryAction?: PrimaryAction;
};

const navItems: Array<{ key: NavKey; label: string; href: string }> = [
  { key: 'feed', label: 'Feed', href: '/feed' },
  { key: 'plans', label: 'Plans', href: '/plans' },
  { key: 'groups', label: 'Prayer Rooms', href: '/groups' },
  { key: 'profile', label: 'Profile', href: '/profile' },
];

export function PrimaryHeader({
  active,
  subtitle,
  containerClassName,
  primaryAction,
}: PrimaryHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const resolvedActive =
    active ??
    navItems.find((item) => {
      if (item.href === '/feed') {
        return pathname === '/' || pathname?.startsWith(item.href);
      }
      if (item.key === 'profile') {
        return pathname?.startsWith('/profile') || pathname?.startsWith('/u/');
      }
      return pathname?.startsWith(item.href);
    })?.key;

  const handleActionClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (primaryAction?.disabled) {
      event.preventDefault();
      return;
    }
    setMobileOpen(false);
  };

  const navLinkClasses = (isActive: boolean) =>
    cn(
      'text-sm font-medium transition-colors',
      isActive ? 'text-golden' : 'text-white/70 hover:text-white'
    );

  const desktopActionClass = cn(
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
    primaryAction?.className ?? 'bg-golden text-black hover:bg-golden/90'
  );

  const mobileActionClass = cn(
    'w-full justify-center',
    primaryAction?.className ?? 'bg-golden text-black hover:bg-golden/90'
  );

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur">
        <div
          className={cn(
            'container mx-auto flex max-w-6xl items-center justify-between px-4 py-4',
            containerClassName
          )}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-golden/30 bg-golden/10">
              <BookOpen className="h-6 w-6 text-golden" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">GO&apos;EL</p>
              {subtitle ? (
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">{subtitle}</p>
              ) : null}
            </div>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={navLinkClasses(resolvedActive === item.key)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {primaryAction ? (
              <Link href={primaryAction.href} onClick={handleActionClick} aria-disabled={primaryAction.disabled}>
                <Button
                  className={desktopActionClass}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.icon}
                  <span>{primaryAction.label}</span>
                </Button>
              </Link>
            ) : null}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
        </div>
      </header>

      <SheetContent side="right" className="bg-black text-white sm:w-80">
        <div className="flex flex-col gap-8 py-8">
          <nav className="flex flex-col gap-4 text-lg">
            {navItems.map((item) => (
              <SheetClose asChild key={item.key}>
                <Link
                  href={item.href}
                  className={cn(
                    'rounded-xl border border-white/10 px-4 py-3 transition-colors hover:border-golden/60 hover:bg-white/5',
                    resolvedActive === item.key ? 'border-golden/70 bg-golden/10 text-golden' : 'text-white/80'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          {primaryAction ? (
            <SheetClose asChild>
              <Link
                href={primaryAction.href}
                className="block"
                aria-disabled={primaryAction.disabled}
                onClick={handleActionClick}
              >
                <Button className={mobileActionClass} disabled={primaryAction.disabled}>
                  {primaryAction.icon}
                  <span>{primaryAction.label}</span>
                </Button>
              </Link>
            </SheetClose>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
