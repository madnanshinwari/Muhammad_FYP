import React from 'react';

export function MetricStatCard({
  title,
  value,
  unit = '',
  subtitle = '',
  icon: Icon,
  badge = null,
  trend = null,
  colorScheme = 'green'
}) {
  const iconBg = {
    green: 'bg-[#b1f2be]/40 text-[#14532D]',
    gold: 'bg-[#ffdf94]/50 text-[#765b00]',
    blue: 'bg-[#e3f0f8] text-[#006e25]'
  }[colorScheme] || 'bg-[#F3F7F1] text-[#14532D]';

  return (
    <div className="card-elevation-1 hover:card-elevation-2 rounded-xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6f7a6c] block">
            {title}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#14532D] tabular-nums tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-[#6f7a6c]">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[#3f4a3d] mt-2 pt-2 border-t border-[#E2E8F0]">
        <span>{subtitle}</span>
        {badge && <span>{badge}</span>}
      </div>
    </div>
  );
}
