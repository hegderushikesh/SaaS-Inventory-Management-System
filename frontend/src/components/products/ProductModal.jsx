import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Modal, Button, Input, Textarea } from '../ui';
import { productSchema } from '../../schemas/productSchemas';
import { productApi } from '../../api/productApi';

export const ProductModal = ({
  isOpen,
  onClose,
  product = null, // null for create, object for edit
  onSuccess
}) => {
  const queryClient = useQueryClient();
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      quantity_on_hand: 0,
      cost_price: '',
      selling_price: '',
      low_stock_threshold: '',
      description: ''
    }
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || '',
        sku: product.sku || '',
        quantity_on_hand: product.quantity_on_hand ?? 0,
        cost_price: product.cost_price ?? '',
        selling_price: product.selling_price ?? '',
        low_stock_threshold: product.low_stock_threshold ?? '',
        description: product.description || ''
      });
    } else {
      reset({
        name: '',
        sku: '',
        quantity_on_hand: 0,
        cost_price: '',
        selling_price: '',
        low_stock_threshold: '',
        description: ''
      });
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean numeric fields
      const payload = {
        name: data.name,
        sku: data.sku,
        quantity_on_hand: parseInt(data.quantity_on_hand, 10),
        cost_price: data.cost_price !== '' && data.cost_price !== null ? parseFloat(data.cost_price) : null,
        selling_price: data.selling_price !== '' && data.selling_price !== null ? parseFloat(data.selling_price) : null,
        low_stock_threshold: data.low_stock_threshold !== '' && data.low_stock_threshold !== null ? parseInt(data.low_stock_threshold, 10) : null,
        description: data.description || null
      };

      if (isEditing) {
        return productApi.updateProduct(product.id, payload);
      }
      return productApi.createProduct(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        isEditing
          ? `Product "${data.name}" updated successfully.`
          : `Product "${data.name}" created successfully!`
      );
      reset();
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Operation failed. Please check product details.';
      toast.error(msg);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title={isEditing ? `Edit Product: ${product.name}` : 'Add New Inventory Product'}
      description="Register and track stock quantities within your organization."
      maxWidth="max-w-lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={mutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Product Name"
          placeholder="e.g. Dell UltraSharp 27-inch 4K Monitor"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="SKU (Stock Keeping Unit)"
            placeholder="e.g. MON-U2723QE"
            required
            helperText="Unique inside your company"
            error={errors.sku?.message}
            {...register('sku')}
          />

          <Input
            label="Quantity On Hand"
            type="number"
            min="0"
            required
            placeholder="0"
            error={errors.quantity_on_hand?.message}
            {...register('quantity_on_hand')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Cost Price ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.cost_price?.message}
            {...register('cost_price')}
          />

          <Input
            label="Selling Price ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.selling_price?.message}
            {...register('selling_price')}
          />
        </div>

        <Input
          label="Low Stock Threshold"
          type="number"
          min="0"
          placeholder="Default organization setting applies if empty"
          helperText="Triggers low-stock alert when quantity is at or below this number"
          error={errors.low_stock_threshold?.message}
          {...register('low_stock_threshold')}
        />

        <Textarea
          label="Description (Optional)"
          rows={3}
          placeholder="Specifications, dimensions, or vendor details..."
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  );
};

export default ProductModal;
