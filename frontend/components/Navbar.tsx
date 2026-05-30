'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#demo', label: 'Demo' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';
  const isLogin = pathname === '/login';
  const isSignup = pathname === '/signup';
  const isJoin = pathname === '/join' || pathname?.startsWith('/join/');
  const isInterview = pathname?.startsWith('/interview/');

  useEffect(() => {
    setVisible(true);
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showRecruiterNav = !isJoin && !isInterview;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      } ${
        scrolled || !isHome
          ? 'backdrop-blur-[20px] bg-black/80 border-b border-white/10'
          : 'bg-transparent'
      }`}
      style={{ transition: 'transform 0.3s ease, opacity 0.3s ease, background 0.3s ease' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display font-bold text-xl flex items-center gap-0.5">
          HIREAI
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue inline-block" />
        </Link>

        {isHome && (
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="nav-link text-sm text-gray-400 hover:text-accent-blue transition-colors cursor-pointer bg-transparent border-none"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {(isHome || showRecruiterNav) && !isJoin && (
            <Link
              href="/join"
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors hidden sm:inline-flex"
            >
              Take Interview
            </Link>
          )}
          {showRecruiterNav && !isLogin && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm border border-[#333] text-white rounded-lg hover:border-accent-blue transition-all duration-300"
            >
              Recruiter Login
            </Link>
          )}
          {showRecruiterNav && !isSignup && (
            <Link
              href="/signup"
              className="px-4 py-2 text-sm gradient-btn text-white rounded-lg font-medium"
            >
              {isLogin ? 'Create Account' : 'Get Started'}
            </Link>
          )}
          {(isJoin || isInterview) && (
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-300 text-xs sm:text-sm"
            >
              Recruiter? Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
