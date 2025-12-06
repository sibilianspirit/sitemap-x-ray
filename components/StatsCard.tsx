import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color = "brand" }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-5 flex items-start justify-between hover:border-gray-600 transition-colors">
      <div>
        <p className="text-gray-400 text-sm font-medium mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-white tracking-tight">{value}</h4>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400`}>
        {icon}
      </div>
    </div>
  );
};
