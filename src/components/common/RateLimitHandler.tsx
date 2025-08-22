import React from 'react';

interface RateLimitHandlerProps {
  error: string | null;
  onRetry: () => void;
}

const RateLimitHandler: React.FC<RateLimitHandlerProps> = ({ error, onRetry }) => {
  if (!error || !error.includes('Rate limit exceeded')) {
    return null;
  }
  
  return (
    <div className="rate-limit-error bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="error-icon text-2xl">⏰</div>
        <h3 className="text-lg font-semibold text-red-400">Rate Limit Exceeded</h3>
      </div>
      <p className="text-red-300 mb-4">
        We're experiencing high traffic. Please wait a moment and try again.
      </p>
      <button 
        onClick={onRetry} 
        className="retry-button bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Retry Now
      </button>
      <div className="auto-retry mt-3">
        <small className="text-red-400">Auto-retrying in 30 seconds...</small>
      </div>
    </div>
  );
};

export default RateLimitHandler;
