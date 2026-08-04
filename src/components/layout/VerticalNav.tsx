import React from 'react';
import Link from 'next/link';
import { Fauna } from '@/components/ui/Fauna';

export const VerticalNav = () => {
  return (
    <aside className="w-full lg:w-[280px] shrink-0 sticky top-[120px] h-[calc(100vh-140px)] z-40">
      <div className="nav-vertical-glass w-full h-full p-8 flex flex-col justify-between relative overflow-y-auto overflow-x-hidden tactical-scrollbar">
        
        <div className="flex flex-col gap-10">
          <div>
            <h3 className="font-fraunces text-2xl text-bone mb-8">Directory</h3>
            <nav className="flex flex-col gap-5 font-geist text-xs uppercase tracking-[0.2em] text-bone/60">
              <Link href="/storefront" className="hover:text-bone transition-colors">Storefront</Link>
              <Link href="/new" className="hover:text-bone transition-colors">New Arrivals</Link>
              
              {/* Hierarchical Menu */}
              <div className="flex flex-col gap-4 mt-2">
                <span className="text-bone/80 font-medium">Categories</span>
                <div className="flex flex-col gap-4 pl-5 border-l border-bone/10 ml-2">
                  <Link href="/category/gis" className="hover:text-bone transition-colors text-[10px] text-bone/50">Tactical Gis</Link>
                  <Link href="/category/rashguards" className="hover:text-bone transition-colors text-[10px] text-bone/50">Rashguards</Link>
                  <Link href="/category/shorts" className="text-ember transition-colors text-[10px] flex items-center gap-3 relative">
                    <div className="absolute -left-[21px] w-2 h-[1px] bg-ember"></div>
                    Grappling Shorts
                  </Link>
                  <Link href="/category/base" className="hover:text-bone transition-colors text-[10px] text-bone/50">Base Layers</Link>
                  <Link href="/category/equipment" className="hover:text-bone transition-colors text-[10px] text-bone/50">Equipment</Link>
                </div>
              </div>
              
              <Link href="/expeditions" className="hover:text-bone transition-colors mt-2">Expeditions</Link>
            </nav>
          </div>

          <div>
            <h4 className="font-geist text-[10px] uppercase tracking-widest text-bone/50 mb-4 border-b border-bone/10 pb-2">Filters</h4>
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group text-[10px] text-bone/70 uppercase tracking-widest">
                <div className="w-3 h-3 border border-ember bg-ember/10 flex items-center justify-center rounded-[2px]">
                  <div className="w-1.5 h-1.5 bg-ember rounded-[1px]"></div>
                </div> 
                Heavy / 450GSM
              </label>
              <label className="flex items-center gap-3 cursor-pointer group text-[10px] text-bone/50 hover:text-bone/70 uppercase tracking-widest transition-colors">
                <div className="w-3 h-3 border border-bone/30 group-hover:border-ember rounded-[2px] transition-colors"></div> 
                Aero / Mesh
              </label>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-bone/10">
           <p className="font-geist text-[10px] text-bone/30 uppercase tracking-widest leading-loose">
            System Online<br/>Bruma Protocol V.3
          </p>
        </div>
      </div>
    </aside>
  );
};
