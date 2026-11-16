import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { productApi } from '../api/productApi';

export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productApi.getProducts(params),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30 // 30 seconds
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.deleteProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      toast.success(`Product "${data.name}" deleted successfully.`);
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to delete product.';
      toast.error(msg);
    }
  });
};
