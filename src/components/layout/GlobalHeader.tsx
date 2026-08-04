import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const GlobalHeader = () => {
  return (
    <header className="nav-horizontal-wall w-full px-8 py-4 flex justify-between items-center relative z-[100]">
      {/* Brand */}
      <Link href="/" className="text-foreground font-fraunces font-black text-3xl tracking-tighter uppercase relative z-10">
        BRUMA
      </Link>
      
      {/* Global Navigation */}
      <nav className="hidden md:flex gap-10 font-geist text-xs uppercase tracking-[0.2em] text-foreground/80 relative z-10">
        <Link href="/catalog" className="text-primary font-semibold border-b border-primary pb-1">
          Armory
        </Link>
        <Link href="/philosophy" className="hover:text-foreground pb-1 transition-colors">
          Philosophy
        </Link>
        <Link href="/logistics" className="hover:text-foreground pb-1 transition-colors">
          Logistics
        </Link>
      </nav>

      {/* Global Utilities */}
      <div className="flex items-center gap-6 relative z-10">
        <button className="text-foreground/70 hover:text-foreground transition-colors p-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <div className="w-[1px] h-4 bg-foreground/20"></div>
        <button className="font-geist text-xs uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors">
          Cart [0]
        </button>
        <Button 
          className="ml-2 font-bold uppercase text-[10px] tracking-[0.15em] shadow-[0_0_15px_rgba(255,77,28,0.2)]"
        >
          Initialize
        </Button>
      </div>
    </header>
  );
};
