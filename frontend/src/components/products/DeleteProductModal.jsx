import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '../ui';
import { useDeleteProduct } from '../../hooks/useProducts';

export const DeleteProductModal = ({ product, isOpen, onClose }) => {
  const deleteMutation = useDeleteProduct();

  if (!product) return null;

  const handleDelete = () => {
    deleteMutation.mutate(product.id, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Product"
      maxWidth="max-w-md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete Product
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <AlertTriangle className="w-5 h-5 stroke-[2]" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-900 leading-snug">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-slate-950">"{product.name}"</span>?
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            SKU: <span className="font-mono text-slate-700">{product.sku}</span> with{' '}
            <span className="font-semibold text-slate-700">{product.quantity_on_hand}</span> units on hand.
            This action cannot be undone and will remove it from all inventory tracking and reports.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteProductModal;
