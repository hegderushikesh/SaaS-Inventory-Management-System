import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';

export const useDashboardSummary = () => {
  return useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardApi.getSummary,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true
  });
};
