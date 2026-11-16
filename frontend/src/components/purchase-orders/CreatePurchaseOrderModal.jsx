import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building,
  Plus,
  Trash2,
  Calendar,
  FileText,
  DollarSign,
  ArrowRight,
  Package
} from 'lucide-react';

import { Modal, Button, Input, Textarea } from '../ui';
import { purchaseOrderSchema } from '../../schemas/supplierSchemas';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useProducts } from '../../hooks/useProducts';
import { useCreatePurchaseOrder } from '../../hooks/usePurchaseOrders';

export const CreatePurchaseOrderModal = ({
  preselectedSupplier = null,
  isOpen,
  onClose
}) => {
  // Fetch suppliers and products
  const { data: suppliersData } = useSuppliers({ limit: 100, sortBy: 'supplier_name', sortOrder: 'ASC' });
  const { data: productsData } = useProducts({ limit: 100, sortBy: 'name', sortOrder: 'ASC' });

  const suppliersList = suppliersData?.data || [];
  const productsList = productsData?.data || [];

  const createPoMutation = useCreatePurchaseOrder();

  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: preselectedSupplier?.id || '',
      po_number: '',
      order_date: todayStr,
      expected_delivery_date: '',
      notes: '',
      items: [
        {
          product_id: '',
          quantity: 10,
          unit_cost: 0
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items') || [];
  const selectedSupplierId = watch('supplier_id');

  // When preselected supplier changes
  useEffect(() => {
    if (preselectedSupplier?.id) {
      setValue('supplier_id', preselectedSupplier.id);
    }
  }, [preselectedSupplier, setValue]);

  // Calculate live total order value
  const totalOrderAmount = useMemo(() => {
    return watchedItems.reduce((acc, item) => {
      const q = parseInt(item?.quantity, 10) || 0;
      const c = parseFloat(item?.unit_cost) || 0;
      return acc + q * c;
    }, 0);
  }, [watchedItems]);

  const handleProductChange = (index, productId) => {
    setValue(`items.${index}.product_id`, productId);
    const prod = productsList.find((p) => p.id === productId);
    if (prod && prod.cost_price !== null && prod.cost_price !== undefined) {
      setValue(`items.${index}.unit_cost`, parseFloat(prod.cost_price));
    }
  };

  const handleModalClose = () => {
    reset({
      supplier_id: preselectedSupplier?.id || '',
      po_number: '',
      order_date: todayStr,
      expected_delivery_date: '',
      notes: '',
      items: [
        {
          product_id: '',
          quantity: 10,
          unit_cost: 0
        }
      ]
    });
    onClose();
  };

  const onSubmit = (formData) => {
    createPoMutation.mutate(formData, {
      onSuccess: () => {
        handleModalClose();
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Create Purchase Order"
      description="Issue a new inventory purchase order to an approved vendor."
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button variant="outline" onClick={handleModalClose} disabled={createPoMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={createPoMutation.isPending}
            rightIcon={ArrowRight}
          >
            Create Purchase Order
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 1. Supplier Selection (REQUIRED) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Select Supplier <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedSupplierId}
              onChange={(e) => setValue('supplier_id', e.target.value)}
              className={`w-full px-3 py-2 text-xs bg-white border rounded-lg focus:outline-hidden focus:border-blue-600 transition-colors ${
                errors.supplier_id ? 'border-red-500' : 'border-slate-200'
              }`}
            >
              <option value="">-- Choose a vendor from your directory --</option>
              {suppliersList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplier_name} {s.company_name ? `(${s.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          {errors.supplier_id && (
            <p className="text-xs text-red-600 mt-1">{errors.supplier_id.message}</p>
          )}
        </div>

        {/* 2. PO Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="PO Number (Optional)"
            placeholder="Auto-generated e.g. PO-8491"
            error={errors.po_number?.message}
            {...register('po_number')}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Order Date
            </label>
            <input
              type="date"
              className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600"
              {...register('order_date')}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Expected Delivery
            </label>
            <input
              type="date"
              className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600"
              {...register('expected_delivery_date')}
            />
          </div>
        </div>

        {/* 3. Line Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 block">
              Order Line Items <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => append({ product_id: '', quantity: 10, unit_cost: 0 })}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product Line
            </button>
          </div>

          {errors.items?.message && (
            <p className="text-xs text-red-600">{errors.items.message}</p>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {fields.map((field, idx) => {
              const currentProdId = watchedItems[idx]?.product_id;
              const currentQty = parseInt(watchedItems[idx]?.quantity, 10) || 0;
              const currentCost = parseFloat(watchedItems[idx]?.unit_cost) || 0;
              const lineTotal = (currentQty * currentCost).toFixed(2);

              return (
                <div
                  key={field.id}
                  className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl grid grid-cols-12 gap-2 items-center"
                >
                  {/* Product Picker */}
                  <div className="col-span-12 sm:col-span-5">
                    <select
                      value={currentProdId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600"
                    >
                      <option value="">-- Select Product --</option>
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 tabular-nums"
                      {...register(`items.${idx}.quantity`)}
                    />
                  </div>

                  {/* Unit Cost */}
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Cost ($)"
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600 tabular-nums"
                      {...register(`items.${idx}.unit_cost`)}
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-xs font-semibold text-slate-800 font-mono tabular-nums">
                      ${lineTotal}
                    </span>
                  </div>

                  {/* Remove button */}
                  <div className="col-span-1 sm:col-span-1 text-right">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Cost Summary Card */}
        <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Estimated Total Amount:</span>
          <span className="text-base font-bold text-blue-700 font-mono tabular-nums">
            ${totalOrderAmount.toFixed(2)}
          </span>
        </div>

        {/* 4. Notes */}
        <Textarea
          label="Purchase Order Notes (Optional)"
          rows={2}
          placeholder="e.g. Shipping instructions, reference contract #, delivery dock 3"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};

export default CreatePurchaseOrderModal;
