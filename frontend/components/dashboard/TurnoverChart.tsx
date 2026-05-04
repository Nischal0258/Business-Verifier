"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface TurnoverChartProps {
  data: { year: string; revenue: number }[];
}

function formatRevenue(value: number): string {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}K`;
  }
  return `£${value}`;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { year: string; revenue: number } }>;
}) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        className="bg-[#0a0a0a] border border-white/[0.08] rounded-lg px-4 py-3 shadow-2xl backdrop-blur-xl"
      >
        <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-white/25 mb-1">
          Fiscal Year {item.year}
        </p>
        <p className="text-xl font-mono tracking-tighter text-white/80">
          {formatRevenue(item.revenue)}
        </p>
      </div>
    );
  }
  return null;
}

export default function TurnoverChart({ data }: TurnoverChartProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="h-full flex flex-col"
    >
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255,255,255,0.02)"
              vertical={false}
            />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.12)", fontFamily: "Fira Code, monospace" }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tickFormatter={(value: number) => formatRevenue(value)}
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.12)", fontFamily: "Fira Code, monospace" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: "rgba(255,255,255,0.015)" }} 
            />
            <Bar dataKey="revenue" radius={[2, 2, 0, 0]} animationDuration={2000}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="rgba(255,255,255,0.03)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
