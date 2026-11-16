import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { supplierApi } from '../api/supplierApi';

/**
 * Hook to fetch paginated suppliers
 */
export const useSuppliers = (params = {}) => {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: () => supplierApi.getSuppliers(params)
  });
};

/**
 * Hook to fetch single supplier detail
 */
export const useSupplier = (id) => {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierApi.getSupplierById(id),
    enabled: Boolean(id)
  });
};

/**
 * Hook to create a new supplier
 */
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => supplierApi.createSupplier(data),
    onSuccess: (data) => {
      toast.success(`Supplier '${data.data.supplier_name}' created successfully.`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Failed to create supplier.';
      toast.error(msg);
    }
  });
};

/**
 * Hook to update an existing supplier
 */
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => supplierApi.updateSupplier(id, data),
    onSuccess: (data) => {
      toast.success(`Supplier '${data.data.supplier_name}' updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', data.data.id] });
    },
    onError: (error) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        'Failed to update supplier.';
      toast.error(msg);
    }
  });
};

/**
 * Hook to delete a supplier
 */
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => supplierApi.deleteSupplier(id),
    onSuccess: () => {
      toast.success('Supplier removed successfully.');
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to delete supplier.';
      toast.error(msg);
    }
  });
};
