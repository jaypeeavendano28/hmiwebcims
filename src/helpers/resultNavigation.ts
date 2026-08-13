import dayjs from 'dayjs';
import useAppStore from '../store';

export const getCompletedResultsSearch = () => {
  const today = dayjs().format('YYYYMMDD');
  const lastQListQuery = useAppStore.getState().lastQListQuery;
  const hasLastQListQuery =
    Boolean(lastQListQuery.dateFrom) ||
    Boolean(lastQListQuery.dateTo) ||
    Boolean(lastQListQuery.searchText) ||
    Boolean(lastQListQuery.departmentId);

  if (hasLastQListQuery) {
    return {
      QueueStatus: 'not-done' as const,
      DateFrom: lastQListQuery.dateFrom,
      DateTo: lastQListQuery.dateTo,
      SearchText: lastQListQuery.searchText,
      DepartmentId: lastQListQuery.departmentId,
    };
  }

  return {
    QueueStatus: 'not-done' as const,
    DateFrom: today,
    DateTo: today,
  };
};
