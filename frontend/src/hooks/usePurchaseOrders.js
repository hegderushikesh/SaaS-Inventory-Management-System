import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { purchaseOrderApi } from '../api/purchaseOrderApi';

/**
 * Hook to fetch paginated purchase orders
 */
export const usePurchaseOrders = (params = {}) => {
  return useQuery({
    queryKey: ['purchase-orders', params],
    queryFn: () => purchaseOrderApi.getPurchaseOrders(params)
  });
};

/**
 * Hook to create a new purchase order
 */
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => purchaseOrderApi.createPurchaseOrder(data),
    onSuccess: (data) => {
      const poNum = data.data?.po_number || 'New PO';
      toast.success(`Purchase Order ${poNum} created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Failed to create purchase order.';
      toast.error(msg);
    }
  });
};
