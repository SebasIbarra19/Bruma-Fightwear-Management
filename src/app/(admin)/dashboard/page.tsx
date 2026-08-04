"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart, Package, Users, RefreshCw } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Fauna } from "@/components/ui/Fauna";
import { Skeleton } from "@/components/ui/skeleton";

const STOCK_BURN = [
  { sku: "BFW-002-BLK-L",  name: "Bruma Tee - Black",      initial: 40,  remaining: 8,   category: "T-Shirts" },
  { sku: "BFW-006-ONG-M",  name: "Sensei Gi Top",          initial: 30,  remaining: 6,   category: "Martial Arts" },
  { sku: "BFW-013-BLK-M",  name: "Kumite Gi Pants",        initial: 20,  remaining: 4,   category: "Martial Arts" },
  { sku: "BFW-016-ONG-M",  name: "Flame Script Hoodie",    initial: 50,  remaining: 15,  category: "Hoodies" },
  { sku: "BFW-011-RED-M",  name: "Rising Sun Crewneck",    initial: 60,  remaining: 34,  category: "Hoodies" },
  { sku: "BFW-004-GRN-M",  name: "Monteverde Cargo Pants", initial: 50,  remaining: 31,  category: "Bottoms" },
  { sku: "BFW-017-BLK-XL", name: "Bruma Tee - Black / XL", initial: 80,  remaining: 62,  category: "T-Shirts" },
];

const ORDERS = [
  { id: "ORD-7842", customer: "Kenji Morales", email: "kenji@email.com", items: 3, total: 234.97, status: "shipped", date: "2025-07-10", products: ["Ryū Oversized Hoodie", "Tiger Palm Tee", "Koi Snapback"] },
  { id: "ORD-7841", customer: "Valentina Cruz", email: "val.cruz@email.com", items: 2, total: 164.98, status: "processing", date: "2025-07-09", products: ["Dragon Back Bomber", "Gold Tiger Beanie"] },
  { id: "ORD-7840", customer: "Daisuke Quesada", email: "dai.q@email.com", items: 1, total: 109.99, status: "pending", date: "2025-07-09", products: ["Sensei Gi Top"] },
  { id: "ORD-7839", customer: "Sofía Nakamura", email: "sofia.n@email.com", items: 4, total: 312.96, status: "shipped", date: "2025-07-08", products: ["Bruma Windbreaker", "Kumite Gi Pants", "Ceiba Spirit Tee", "Warrior Waist Bag"] },
  { id: "ORD-7838", customer: "Mateo Tanaka", email: "m.tanaka@email.com", items: 2, total: 174.98, status: "cancelled", date: "2025-07-07", products: ["Kata Track Jacket", "Monteverde Cargo Pants"] },
];

export default function DashboardView() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const kpis = [
    { label: "Revenue (Jul)", value: "₡74.2M", sub: "+26% vs Jun", icon: TrendingUp, color: "text-ember" },
    { label: "Active Orders", value: "284", sub: "47 pending action", icon: ShoppingCart, color: "text-ember" },
    { label: "Inventory SKUs", value: "17", sub: "3 out of stock", icon: Package, color: "text-[#7ddb7d]" },
    { label: "New Customers", value: "138", sub: "This month", icon: Users, color: "text-[#7ddb7d]" },
  ];

  useEffect(() => {
    const checkAuth = () => {
      setLoading(false);
    };
    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <Skeleton className="w-full h-24 rounded-[2px]" />
          <Skeleton className="w-full h-24 rounded-[2px]" />
          <Skeleton className="w-full h-24 rounded-[2px]" />
          <Skeleton className="w-full h-24 rounded-[2px]" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Skeleton className="xl:col-span-2 h-[400px] rounded-[2px]" />
          <Skeleton className="h-[400px] rounded-[2px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-8 relative">
      
      {/* Decorative Jaguar positioned behind elements */}
      <Fauna 
        src="/brand/images/Jaguar-01.png" 
        alt="Jaguar"
        className="w-[700px] right-[-10%] top-[40px] -z-10 opacity-40 mix-blend-luminosity transform -scale-x-100 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
        mobileStrategy="hide"
      />

      <PageHeader
        label="Command Center"
        title="Dashboard"
        sub="Welcome back — here is your brand at a glance."
        actionLabel="Refresh"
        actionIcon={<RefreshCw size={14} />}
        bgImage="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=1200&h=300&fit=crop&auto=format"
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <FloraGlass
            key={label}
            className="p-6 transition-all hover:border-ember/40 relative group"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className="font-fraunces text-3xl font-bold text-bone leading-none mb-2">{value}</p>
            <p className="text-xs text-bone/40 font-geist">{sub}</p>
          </FloraGlass>
        ))}
      </div>

      {/* Main Panels Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Stock Burn Rate panel */}
        <FloraGlass className="xl:col-span-2 p-6 flex flex-col justify-between relative !overflow-visible">
          <div>
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Stock Burn Rate</p>
                <p className="font-fraunces text-2xl font-bold text-bone uppercase tracking-tight">Fastest-Moving SKUs</p>
              </div>
              <span className="text-[10px] text-bone/40 font-geist uppercase tracking-widest border border-bone/10 px-2 py-1 rounded-[2px] bg-bone/5">Jul 2025</span>
            </div>
            <div className="space-y-5">
              {STOCK_BURN.map(item => {
                const pct = Math.round(((item.initial - item.remaining) / item.initial) * 100);
                const burnColor = pct >= 80 ? "#ff4d1c" : pct >= 50 ? "#d4a017" : "#7ddb7d";
                return (
                  <div key={item.sku} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-geist text-[10px] text-bone/40 tracking-widest uppercase shrink-0">{item.sku.slice(-5)}</span>
                        <span className="text-sm text-bone font-geist font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 ml-4 shrink-0">
                        <span className="font-geist text-xs text-bone/40">{item.remaining} left</span>
                        <span className="font-fraunces text-base font-bold" style={{ color: burnColor }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-bone/5 rounded-full overflow-hidden relative border border-bone/5">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, backgroundColor: burnColor, boxShadow: `0 0 10px ${burnColor}40` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FloraGlass>

        {/* Recent Orders Side Panel */}
        <FloraGlass className="p-6 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-6">Recent Orders</p>
            <div className="space-y-5">
              {ORDERS.slice(0, 5).map(o => (
                <div key={o.id} className="flex items-center justify-between border-b border-bone/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm text-bone font-fraunces font-bold">{o.customer}</p>
                    <p className="text-[10px] text-bone/40 font-geist uppercase tracking-widest mt-0.5">{o.id}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="text-sm font-geist text-bone font-medium">${o.total.toFixed(2)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FloraGlass>
      </div>
    </div>
  );
}
