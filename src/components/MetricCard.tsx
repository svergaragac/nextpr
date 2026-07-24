import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  id: string;
  title: string;
  value: string;
  unit?: string;
  subtext: React.ReactNode;
  subtextColorClass?: string;
  icon: LucideIcon;
  iconColorClass?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  subtext,
  subtextColorClass = 'text-cohere-body-muted',
  icon: Icon,
  iconColorClass = 'text-cohere-blue'
}: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-cohere-canvas border border-cohere-hairline hover:border-cohere-primary/20 hover:shadow-sm rounded-xl p-6 transition-all duration-300 relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-5">
        <span className="text-[11px] font-mono tracking-[0.08em] text-cohere-slate uppercase">
          {title}
        </span>
        <Icon className="w-4 h-4 text-cohere-muted shrink-0" />
      </div>

      <div className="flex items-baseline mb-3">
        <span className="text-[52px] leading-none font-display font-normal text-cohere-primary tracking-[-0.02em]">
          {value}
        </span>
        {unit && (
          <span className="text-lg font-display text-cohere-muted ml-1.5">
            {unit}
          </span>
        )}
      </div>

      <div className={`text-sm font-sans flex items-center gap-1.5 ${subtextColorClass}`}>
        {subtext}
      </div>
    </motion.div>
  );
}


