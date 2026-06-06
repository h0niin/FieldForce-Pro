import React, { useState, useEffect } from 'react';

export type SlaStatus = 'PENDING' | 'PAUSED' | 'MET' | 'BREACHED';

interface SlaCountdownCellProps {
  deadline: string | Date | null;
  status: SlaStatus;
}

export const SlaCountdownCell: React.FC<SlaCountdownCellProps> = ({ deadline, status }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState<boolean>(false);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('No SLA');
      setIsOverdue(false);
      return;
    }

    if (status === 'MET') {
      setTimeLeft('SLA Met');
      setIsOverdue(false);
      return;
    }

    if (status === 'BREACHED') {
      setTimeLeft('SLA Breached');
      setIsOverdue(true);
      return;
    }

    if (status === 'PAUSED') {
      setTimeLeft('Paused');
      setIsOverdue(false);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsOverdue(true);
        setTimeLeft('Overdue');
        return;
      }

      setIsOverdue(false);
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const parts = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setTimeLeft(parts.join(' '));
    };

    calculateTimeLeft();
    const timerId = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timerId);
  }, [deadline, status]);

  let tagClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  if (status === 'MET') {
    tagClass += ' bg-green-100 text-green-800';
  } else if (status === 'BREACHED' || isOverdue) {
    tagClass += ' bg-red-100 text-red-800 animate-pulse';
  } else if (status === 'PAUSED') {
    tagClass += ' bg-gray-100 text-gray-800';
  } else {
    // PENDING and running
    tagClass += ' bg-blue-100 text-blue-800';
  }

  if (!deadline) {
    tagClass = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500';
  }

  return (
    <div className="flex items-center">
      <span className={tagClass}>

        {timeLeft}
      </span>
    </div>
  );
};
