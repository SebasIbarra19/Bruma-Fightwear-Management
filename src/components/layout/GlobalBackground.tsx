import React from 'react';

export const GlobalBackground = () => {
  return (
    <>
      {/* Base Obsidian Background */}
      <div className="fixed inset-0 z-0 bg-background pointer-events-none"></div>
      
      {/* Tactical Grid */}
      <div className="fixed inset-0 z-0 tactical-grid pointer-events-none"></div>
      
      {/* Bruma Fog Wash */}
      <div className="fixed inset-0 z-0 bruma-wash pointer-events-none"></div>
      
      {/* Topographic Lines (SVG) */}
      <svg 
        className="fixed top-0 left-0 w-full h-[200vh] pointer-events-none opacity-10 text-foreground z-0 mix-blend-screen" 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="none" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1"
      >
        <path d="M-100,100 C200,200 400,0 600,150 S800,250 1100,100" />
        <path d="M-100,120 C220,220 420,20 620,170 S820,270 1100,120" />
        <path d="M-100,140 C240,240 440,40 640,190 S840,290 1100,140" />
        
        <path d="M-100,400 C200,500 500,450 700,600 S900,500 1100,650" />
        <path d="M-100,420 C220,520 520,470 720,620 S920,520 1100,670" />
        <path d="M-100,440 C240,540 540,490 740,640 S940,540 1100,690" />
        <path d="M-100,460 C260,560 560,510 760,660 S960,560 1100,710" />
      </svg>
    </>
  );
};
