"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/90 to-blue-900/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="text-xl">🛰️</span>
            <span className="text-sm font-medium text-gray-300 hover:text-cyan-300 transition-colors duration-300">
              TEMPO Air
            </span>
          </div>

          {/* Nav links */}
          <div className="flex space-x-6">
            <NavLink href="/" label="Home" />
            <NavLink href="/map" label="Live Map" />
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/about" label="About" />
          </div>
        </div>
      </div>

      {/* bottom glow line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
    </nav>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="relative text-sm font-medium text-gray-300 hover:text-cyan-300 transition-colors duration-300"
    >
      {label}
    </Link>
  );
}
