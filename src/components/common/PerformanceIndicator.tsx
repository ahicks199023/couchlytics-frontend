import React from 'react';

interface PerformanceIndicatorProps {
  calculationMethod?: string;
}

const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ calculationMethod }) => {
  if (!calculationMethod) return null;
  
  const getIndicatorColor = (method: string) => {
    switch (method) {
      case 'optimized_single_query':
        return 'bg-green-600';
      case 'fallback_loop':
        return 'bg-yellow-600';
      case 'emergency_fallback':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };
  
  const getIndicatorText = (method: string) => {
    switch (method) {
      case 'optimized_single_query':
        return '⚡ Optimized';
      case 'fallback_loop':
        return '⚠️ Fallback';
      case 'emergency_fallback':
        return '🚨 Emergency';
      default:
        return '❓ Unknown';
    }
  };
  
  return (
    <div className={`performance-indicator ${getIndicatorColor(calculationMethod)} text-white text-xs px-2 py-1 rounded-full inline-block`}>
      <small>{getIndicatorText(calculationMethod)}</small>
    </div>
  );
};

export default PerformanceIndicator;
