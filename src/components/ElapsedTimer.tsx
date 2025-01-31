import React, { useEffect, useState } from 'react';

interface ElapsedTimerProps {
  startTime: number | null; // The timestamp when the puzzle started
  isRunning: boolean; // Whether the timer should run
}

const ElapsedTimer: React.FC<ElapsedTimerProps> = ({
  startTime,
  isRunning,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) return;

    const updateTimer = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000)); // Compute elapsed seconds
    };

    updateTimer(); // Update immediately when component mounts
    const interval = setInterval(updateTimer, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center space-x-2 text-lg font-semibold">
      <span>⏳</span>
      <span className="tabular-nums w-12 text-center">
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
};

export default ElapsedTimer;
