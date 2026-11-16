import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi } from '../api/settingsApi';

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: settingsApi.updateSettings,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Organization settings updated successfully.');
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to update settings.';
      toast.error(msg);
    }
  });
};
