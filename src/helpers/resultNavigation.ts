import dayjs from 'dayjs';

export const getCompletedResultsSearch = () => {
  const today = dayjs().format('YYYYMMDD');

  return {
    QueueStatus: 'not-done' as const,
    DateFrom: today,
    DateTo: today,
  };
};
