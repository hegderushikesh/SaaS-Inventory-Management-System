import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  ArrowRight,
  AlertTriangle,
  Package,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

import { Modal, Button, Input, Textarea, Select } from '../ui';
import { recordMovementSchema } from '../../schemas/productSchemas';
import { useRecordStockMovement } from '../../hooks/useStockMovements';
import { useProducts } from '../../hooks/useProducts';

export const RecordMovementModal = ({
  isOpen,
  onClose,
  preselectedProduct = null
}) => {
  // Fetch active products for selection dropdown
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({
    limit: 100,
    sortBy: 'name',
    sortOrder: 'ASC'
  });

  const productsList = productsData?.data || [];
  const recordMutation = useRecordStockMovement();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(recordMovementSchema),
    defaultValues: {
      product_id: preselectedProduct?.id || '',
      movement_type: 'IN',
      adjustment_type: 'INCREASE',
      quantity: 10,
      reason: '',
      reference_number: ''
    }
  });

  const selectedProductId = watch('product_id');
  const selectedMovementType = watch('movement_type');
  const selectedAdjustmentType = watch('adjustment_type');
  const watchedQuantity = watch('quantity');

  // Pre-fill when preselectedProduct changes
  useEffect(() => {
    if (preselectedProduct?.id) {
      setValue('product_id', preselectedProduct.id);
    }
  }, [preselectedProduct, setValue]);

  // Find currently selected product object
  const currentProduct = useMemo(() => {
    return productsList.find((p) => p.id === selectedProductId) || preselectedProduct;
  }, [productsList, selectedProductId, preselectedProduct]);

  // Calculate projected new quantity
  const currentStock = currentProduct ? currentProduct.quantity_on_hand : 0;
  const parsedQty = parseInt(watchedQuantity, 10) || 0;

  const projectedStock = useMemo(() => {
    if (!currentProduct) return 0;
    if (selectedMovementType === 'IN') {
      return currentStock + parsedQty;
    }
    if (selectedMovementType === 'OUT') {
      return currentStock - parsedQty;
    }
    if (selectedMovementType === 'ADJUSTMENT') {
      if (selectedAdjustmentType === 'DECREASE') {
        return currentStock - parsedQty;
      }
      return currentStock + parsedQty;
    }
    return currentStock;
  }, [currentProduct, currentStock, selectedMovementType, selectedAdjustmentType, parsedQty]);

  const isInsufficientStock =
    (selectedMovementType === 'OUT' ||
      (selectedMovementType === 'ADJUSTMENT' && selectedAdjustmentType === 'DECREASE')) &&
    currentStock < parsedQty;

  const handleClose = () => {
    reset({
      product_id: preselectedProduct?.id || '',
      movement_type: 'IN',
      adjustment_type: 'INCREASE',
      quantity: 10,
      reason: '',
      reference_number: ''
    });
    onClose();
  };

  const onSubmit = (formData) => {
    if (isInsufficientStock) return;

    recordMutation.mutate(
      {
        product_id: formData.product_id,
        movement_type: formData.movement_type,
        quantity: parseInt(formData.quantity, 10),
        reason: formData.reason,
        reference_number: formData.reference_number || null,
        adjustment_type:
          formData.movement_type === 'ADJUSTMENT' ? formData.adjustment_type : null
      },
      {
        onSuccess: () => {
          handleClose();
        }
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Stock Movement"
      description="Register an inbound receipt, outbound dispatch, or audit inventory correction."
      maxWidth="max-w-lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={recordMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={recordMutation.isPending}
            disabled={isInsufficientStock || !selectedProductId}
            rightIcon={ArrowRight}
          >
            Record Movement
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 1. Product Selection */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Select Product <span className="text-red-500">*</span>
          </label>
          {preselectedProduct ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 block text-xs">
                  {preselectedProduct.name}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  SKU: {preselectedProduct.sku}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                {preselectedProduct.quantity_on_hand} available
              </span>
            </div>
          ) : (
            <select
              value={selectedProductId}
              onChange={(e) => setValue('product_id', e.target.value)}
              disabled={isLoadingProducts}
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-hidden focus:border-blue-600 transition-colors ${
                errors.product_id ? 'border-red-500' : 'border-slate-200'
              }`}
            >
              <option value="">-- Choose a catalog product --</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.quantity_on_hand} units available
                </option>
              ))}
            </select>
          )}
          {errors.product_id && (
            <p className="text-xs text-red-600 mt-1">{errors.product_id.message}</p>
          )}
        </div>

        {/* 2. Movement Type Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Movement Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setValue('movement_type', 'IN')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedMovementType === 'IN'
                  ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-md bg-emerald-100/80 text-emerald-700 flex items-center justify-center mb-1">
                <ArrowDownLeft className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-xs font-semibold block">Stock In</span>
              <span className="text-[10px] text-slate-400">Inbound / Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('movement_type', 'OUT')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedMovementType === 'OUT'
                  ? 'border-red-500 bg-red-50/80 text-red-900 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-md bg-red-100/80 text-red-700 flex items-center justify-center mb-1">
                <ArrowUpRight className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-xs font-semibold block">Stock Out</span>
              <span className="text-[10px] text-slate-400">Dispatch / Sale</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('movement_type', 'ADJUSTMENT')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                selectedMovementType === 'ADJUSTMENT'
                  ? 'border-blue-500 bg-blue-50/80 text-blue-900 shadow-2xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="w-7 h-7 rounded-md bg-blue-100/80 text-blue-700 flex items-center justify-center mb-1">
                <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="text-xs font-semibold block">Adjustment</span>
              <span className="text-[10px] text-slate-400">Count Correction</span>
            </button>
          </div>
          {errors.movement_type && (
            <p className="text-xs text-red-600 mt-1">{errors.movement_type.message}</p>
          )}
        </div>

        {/* 2b. If Adjustment: Increase or Decrease toggle */}
        {selectedMovementType === 'ADJUSTMENT' && (
          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-slate-700 block">
              Adjustment Action
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('adjustment_type', 'INCREASE')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                  selectedAdjustmentType === 'INCREASE'
                    ? 'border-blue-500 bg-white text-blue-700 shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-white/60'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                Increase Stock (+)
              </button>

              <button
                type="button"
                onClick={() => setValue('adjustment_type', 'DECREASE')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                  selectedAdjustmentType === 'DECREASE'
                    ? 'border-blue-500 bg-white text-blue-700 shadow-2xs'
                    : 'border-transparent text-slate-600 hover:bg-white/60'
                }`}
              >
                <MinusCircle className="w-3.5 h-3.5 text-blue-600" />
                Decrease Stock (-)
              </button>
            </div>
          </div>
        )}

        {/* 3. Quantity & Projection Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <Input
            label="Quantity"
            type="number"
            min="1"
            required
            placeholder="e.g. 25"
            error={errors.quantity?.message}
            {...register('quantity')}
          />

          {/* Stock Level Projection Card */}
          <div className="p-3 rounded-lg border bg-slate-50/80 border-slate-200 mt-6 sm:mt-0">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              Stock Projection
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                {currentStock} units
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`text-sm font-bold font-mono tabular-nums ${
                  isInsufficientStock ? 'text-red-600' : 'text-blue-600'
                }`}
              >
                {projectedStock} units
              </span>
            </div>
            {isInsufficientStock && (
              <span className="text-[11px] text-red-600 font-medium block mt-1">
                Deduction exceeds current stock!
              </span>
            )}
          </div>
        </div>

        {/* 4. Reason (Required) */}
        <Input
          label="Reason for Movement"
          required
          placeholder="e.g. Vendor replenishment PO-1029, or Order #5092 dispatch"
          error={errors.reason?.message}
          helperText="Audit description recorded in the permanent history log."
          {...register('reason')}
        />

        {/* 5. Reference Number (Optional) */}
        <Input
          label="Reference Number (Optional)"
          placeholder="e.g. PO-8491, SO-2034, RET-094"
          error={errors.reference_number?.message}
          {...register('reference_number')}
        />
      </form>
    </Modal>
  );
};

export default RecordMovementModal;
