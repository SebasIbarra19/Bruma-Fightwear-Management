"use client";

import React, { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Cell,
  PieChart, Pie
} from "recharts";
import { TrendingUp, ShoppingCart, Package, ArrowUpRight } from "lucide-react";
import { PageHeader, StatusBadge } from "@/components/figma-shared/Common";
import { FloraGlass } from "@/components/ui/FloraGlass";
import { Fauna } from "@/components/ui/Fauna";
import { Skeleton } from "@/components/ui/skeleton";

// RECHARTS MOCK DATA
const REVENUE_TREND = [
  { month: "Jan", revenue: 45 },
  { month: "Feb", revenue: 52 },
  { month: "Mar", revenue: 49 },
  { month: "Apr", revenue: 63 },
  { month: "May", revenue: 58 },
  { month: "Jun", revenue: 69 },
  { month: "Jul", revenue: 74.2 },
];

const CATEGORY_STOCK = [
  { name: "Gis", stock: 124, color: "#ff4d1c" }, 
  { name: "Rashguards", stock: 248, color: "#1a2e1a" }, 
  { name: "Shorts", stock: 145, color: "#d4a017" }, 
  { name: "Base Layers", stock: 85, color: "#f0e8d5" }, 
  { name: "Accessories", stock: 190, color: "#ff4d1c" }
];

const ORDER_STATUS = [
  { name: "Shipped", value: 184, color: "#7ddb7d" }, 
  { name: "Processing", value: 64, color: "#d4a017" }, 
  { name: "Pending", value: 36, color: "#ff4d1c" }, 
  { name: "Cancelled", value: 12, color: "#ff8099" } 
];

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-obsidian/90 border border-bone/15 px-4 py-3 rounded-[4px] backdrop-blur-md shadow-2xl">
        <p className="font-geist text-[10px] text-bone/40 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-fraunces text-base font-bold text-bone">
          {payload[0].name}: <span className="text-ember">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function StatisticsView() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null; 
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
        <Skeleton className="w-full h-32 rounded-[2px]" />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <Skeleton className="xl:col-span-8 h-[400px] rounded-[4px]" />
          <Skeleton className="xl:col-span-4 h-[400px] rounded-[4px]" />
          <Skeleton className="xl:col-span-6 h-[320px] rounded-[4px]" />
          <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[140px] rounded-[4px]" />
            <Skeleton className="h-[140px] rounded-[4px]" />
            <Skeleton className="md:col-span-2 h-[100px] rounded-[4px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-8 relative">
      
      {/* Crocodile peeking from behind the charts grid */}
      <Fauna 
        src="/brand/images/Bruma-Crocodile-02.png" 
        alt="Crocodile"
        className="w-[800px] right-[-15%] bottom-[-5%] -z-10 opacity-30 mix-blend-luminosity rotate-6"
        mobileStrategy="hide"
      />

      <PageHeader
        label="Tactical Intel"
        title="Statistics"
        sub="Advanced analytical subroutines. Monitor sales trajectories, stock distribution, and fulfillment velocity."
        bgImage="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop&auto=format"
      />

      {/* Main Stats Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Sales Trajectory (Area Chart - 8 cols) */}
        <FloraGlass className="xl:col-span-8 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Financial Trajectory</p>
                <h3 className="font-fraunces text-2xl font-bold text-bone">Revenue Trend</h3>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 text-xs text-bone/60">
                  <div className="w-2.5 h-2.5 bg-ember rounded-full shadow-[0_0_10px_#ff4d1c]"></div>
                  Gross Sales (₡M)
                </div>
                <span className="text-[10px] text-bone/40 font-geist uppercase tracking-widest border border-bone/10 px-2 py-1 rounded-[2px] bg-bone/5">YTD</span>
              </div>
            </div>
            
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={REVENUE_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4d1c" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ff4d1c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 232, 213, 0.03)" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(240, 232, 213, 0.4)" 
                    fontSize={10} 
                    fontFamily="Inter"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(240, 232, 213, 0.4)" 
                    fontSize={10} 
                    fontFamily="Inter"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₡${v}M`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area 
                    name="Revenue"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ff4d1c" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorEmber)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FloraGlass>

        {/* Order Status Distribution (Pie Chart - 4 cols) */}
        <FloraGlass className="xl:col-span-4 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Fulfillment Velocity</p>
            <h3 className="font-fraunces text-2xl font-bold text-bone mb-8">Fulfillment Ratio</h3>
            
            <div className="h-[240px] w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ORDER_STATUS}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ORDER_STATUS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(26, 18, 8, 0.8)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-fraunces text-3xl font-bold text-bone">296</span>
                <span className="font-geist text-[9px] text-bone/40 uppercase tracking-widest mt-0.5">Total Orders</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
              {ORDER_STATUS.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-geist text-[10px] text-bone/70 uppercase tracking-widest font-semibold">{item.name}</span>
                  <span className="font-geist text-[10px] text-bone/40 ml-auto font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </FloraGlass>

        {/* Category Density (Bar Chart - 6 cols) */}
        <FloraGlass className="xl:col-span-6 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Structural Logistics</p>
            <h3 className="font-fraunces text-2xl font-bold text-bone mb-8">Category Density</h3>
            
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CATEGORY_STOCK} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(240, 232, 213, 0.03)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(240, 232, 213, 0.4)" 
                    fontSize={10} 
                    fontFamily="Inter"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(240, 232, 213, 0.4)" 
                    fontSize={10} 
                    fontFamily="Inter"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="stock" radius={[2, 2, 0, 0]}>
                    {CATEGORY_STOCK.map((entry, index) => {
                      const colors = ["#ff4d1c", "#7ddb7d", "#d4a017", "#f0e8d5", "#ff4d1c"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.8} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FloraGlass>

        {/* Auxiliary Stats - 6 cols */}
        <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <FloraGlass className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="p-2 bg-moss/20 rounded-[2px] border border-[#7ddb7d]/30 text-[#7ddb7d]"><TrendingUp size={16} /></span>
                <span className="font-geist text-[9px] uppercase tracking-widest font-bold text-[#7ddb7d] flex items-center gap-1">
                  +18% 
                </span>
              </div>
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Consolidated Value</p>
              <h4 className="font-fraunces text-3xl font-bold text-bone mb-2">₡104.8M</h4>
              <p className="text-xs text-bone/40 font-geist">Total valuation of catalog and active assets.</p>
            </div>
          </FloraGlass>

          <FloraGlass className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="p-2 bg-ember/10 rounded-[2px] border border-ember/30 text-ember"><Package size={16} /></span>
                <span className="font-geist text-[9px] uppercase tracking-widest font-bold text-ember">3 Critical</span>
              </div>
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Logistics Integrity</p>
              <h4 className="font-fraunces text-3xl font-bold text-bone mb-2">94.2%</h4>
              <p className="text-xs text-bone/40 font-geist">Stock availability ratio across all active variant SKUs.</p>
            </div>
          </FloraGlass>

          <FloraGlass className="md:col-span-2 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-bone/50 font-geist uppercase tracking-widest mb-1">Directives Sync</p>
              <h4 className="font-fraunces text-xl font-bold text-bone mb-3">Vault Connection Integrity</h4>
              <div className="flex items-center gap-3 bg-bone/5 border border-bone/10 p-3 rounded-[2px]">
                <div className="w-2 h-2 bg-[#7ddb7d] rounded-full animate-pulse shadow-[0_0_8px_#7ddb7d]"></div>
                <span className="font-geist text-[10px] text-bone/70 uppercase tracking-widest font-bold">Node 24 (San José) Synchronized • 12ms latency</span>
              </div>
            </div>
          </FloraGlass>

        </div>

      </div>
    </div>
  );
}
