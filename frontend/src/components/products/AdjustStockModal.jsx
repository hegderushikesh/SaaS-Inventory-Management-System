import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PlusCircle, MinusCircle, ArrowRight } from 'lucide-react';

import { Modal, Button, Input, Textarea } from '../ui';
import { adjustStockSchema } from '../../schemas/productSchemas';
import { productApi } from '../../api/productApi';

export const AdjustStockModal = ({
  product,
  isOpen,
  onClose,
  onSuccess
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      adjustment_type: 'INCREASE',
      quantity: 10,
      note: ''
    }
  });

  const selectedType = watch('adjustment_type');

  const mutation = useMutation({
    mutationFn: (data) => productApi.adjustStock(product.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success(
        `Stock updated for ${product.name}! New level: ${response.data.quantity_on_hand} units.`
      );
      reset();
      if (onSuccess) onSuccess(response.data);
      onClose();
    },
    onError: (error) => {
      const msg = error.response?.data?.message || 'Failed to adjust stock.';
      toast.error(msg);
    }
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Adjust Stock Level: ${product.name}`}
      description={`SKU: ${product.sku} | Currently available: ${product.quantity_on_hand} units`}
      maxWidth="max-w-md"
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
            rightIcon={ArrowRight}
          >
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Adjustment Type Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setValue('adjustment_type', 'INCREASE')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === 'INCREASE'
                  ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Increase (Restock)
            </button>

            <button
              type="button"
              onClick={() => setValue('adjustment_type', 'DECREASE')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                selectedType === 'DECREASE'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MinusCircle className="w-4 h-4 text-amber-600" />
              Decrease (Write-off/Sale)
            </button>
          </div>
          {errors.adjustment_type && (
            <p className="text-xs text-red-600 mt-1">{errors.adjustment_type.message}</p>
          )}
        </div>

        {/* Quantity Field */}
        <Input
          label="Quantity"
          type="number"
          min="1"
          required
          placeholder="e.g. 15"
          error={errors.quantity?.message}
          {...register('quantity')}
        />

        {/* Reason / Note Field */}
        <Textarea
          label="Reason / Reference Note (Optional)"
          rows={2}
          placeholder="e.g. Supplier batch #418 arrived, or retail sale fulfillment"
          error={errors.note?.message}
          {...register('note')}
        />
      </form>
    </Modal>
  );
};

export default AdjustStockModal;
