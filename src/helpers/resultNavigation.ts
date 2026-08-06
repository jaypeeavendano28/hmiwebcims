import dayjs from 'dayjs';

export const getCompletedResultsSearch = () => {
  const today = dayjs().format('YYYYMMDD');

  return {
    QueueStatus: 'done' as const,
    DateFrom: today,
    DateTo: today,
  };
};
