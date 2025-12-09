import { useState, useEffect } from 'react';

export function useDigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long'
    });
  };

  return {
    time,
    formattedTime: formatTime(time),
    formattedDate: formatDate(time),
    formattedDay: formatDay(time),
  };
}
