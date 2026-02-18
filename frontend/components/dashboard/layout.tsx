'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  ChevronDown,
  Menu,
  X,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: 'Oversikt',
    href: '/',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Kunder',
    href: '/customers',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    label: 'Prosjekter',
    href: '/projects',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: 'Kostnadsdeling',
    href: '/cost-sharing',
    icon: <Scale className="w-5 h-5" />,
  },
  {
    label: 'Rapporter',
    href: '/reports',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-xl font-bold text-foreground">KommuneApp</div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            asChild
          >
            <Link href="/settings">
              <Settings className="w-5 h-5" />
              <span>Innstillinger</span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-card border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:inline-flex p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
            <h1 className="text-2xl font-bold text-foreground hidden md:block">
              KommuneApp Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Kommune Administrator
            </div>
            <button className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-semibold hover:opacity-90 transition-opacity">
              KA
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-card border-b border-border p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
