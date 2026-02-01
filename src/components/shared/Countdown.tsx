import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProps {
  endTime: Date;
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function Countdown({ endTime, onComplete, size = 'md' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const diff = endTime.getTime() - Date.now();
    if (diff <= 0) return { minutes: 0, seconds: 0, total: 0 };
    
    return {
      minutes: Math.floor(diff / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      total: diff,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onComplete]);

  const isLow = timeLeft.total > 0 && timeLeft.total <= 30000; // Last 30 seconds
  const isExpired = timeLeft.total <= 0;

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const formatNumber = (n: number) => n.toString().padStart(2, '0');

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Clock className="w-5 h-5" />
        <span className={sizeClasses[size]}>Lejárt</span>
      </div>
    );
  }

  return (
    <div 
      className={`
        flex items-center gap-2 
        ${isLow ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-gray-900 dark:text-white'}
      `}
    >
      <Clock className={`${size === 'lg' ? 'w-8 h-8' : size === 'md' ? 'w-6 h-6' : 'w-5 h-5'}`} />
      <span className={`font-mono font-bold ${sizeClasses[size]}`}>
        {formatNumber(timeLeft.minutes)}:{formatNumber(timeLeft.seconds)}
      </span>
    </div>
  );
}

// Simple countdown bar
interface CountdownBarProps {
  endTime: Date;
  totalSeconds: number;
}

export function CountdownBar({ endTime, totalSeconds }: CountdownBarProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = endTime.getTime() - Date.now();
      const percentage = Math.max(0, (diff / (totalSeconds * 1000)) * 100);
      setProgress(percentage);
    }, 100);

    return () => clearInterval(timer);
  }, [endTime, totalSeconds]);

  const isLow = progress <= 20;

  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-100 ${isLow ? 'bg-red-500' : 'bg-blue-500'}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
