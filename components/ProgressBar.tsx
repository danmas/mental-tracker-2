import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  height?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = "", height = "h-2" }) => {
  const validProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${height} ${className}`}>
      <div 
        className="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${validProgress}%` }}
      />
    </div>
  );
};