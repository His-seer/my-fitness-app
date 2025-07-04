import React from 'react';

interface ProgressBarProps {
  current: number;
  target: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  target, 
  color, 
  size = 'md' 
}) => {
  const percentage = Math.min(100, (current / target) * 100);
  const height = size === 'sm' ? 'h-2' : size === 'lg' ? 'h-6' : 'h-4';
  
  return (
    <div className={`w-full bg-gray-700 rounded-full ${height} overflow-hidden shadow-inner`}>
      <div 
        className={`${color} ${height} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>
    </div>
  );
};