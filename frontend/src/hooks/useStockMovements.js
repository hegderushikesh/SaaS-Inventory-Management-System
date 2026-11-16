import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stockMovementApi } from '../api/stockMovementApi';

/**
 * Hook to fetch paginated stock movements with filters
 */
export const useStockMovements = (params = {}) => {
  return useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => stockMovementApi.getMovements(params)
  });
};

/**
 * Hook to fetch stock movements for a specific product
 */
export const useProductStockMovements = (productId, params = {}) => {
  return useQuery({
    queryKey: ['stock-movements', 'product', productId, params],
    queryFn: () => stockMovementApi.getProductMovements(productId, params),
    enabled: Boolean(productId)
  });
};

/**
 * Hook to fetch a single stock movement detail
 */
export const useStockMovement = (id) => {
  return useQuery({
    queryKey: ['stock-movement', id],
    queryFn: () => stockMovementApi.getMovementById(id),
    enabled: Boolean(id)
  });
};

/**
 * Hook to record a new stock movement
 */
export const useRecordStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => stockMovementApi.recordMovement(data),
    onSuccess: (data) => {
      const type = data?.data?.movement?.movement_type || 'Movement';
      const qty = data?.data?.movement?.quantity;
      toast.success(`Stock ${type} (${qty} units) recorded successfully.`);

      // Invalidate relevant server state
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Failed to record stock movement. Please verify inputs.';
      toast.error(message);
    }
  });
};
