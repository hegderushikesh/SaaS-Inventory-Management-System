import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal, Button } from '../ui';
import { useDeleteSupplier } from '../../hooks/useSuppliers';

export const DeleteSupplierModal = ({ supplier, isOpen, onClose }) => {
  const deleteMutation = useDeleteSupplier();

  if (!supplier) return null;

  const handleDelete = () => {
    deleteMutation.mutate(supplier.id, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Supplier"
      description="This action cannot be undone."
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
            leftIcon={Trash2}
          >
            Delete Supplier
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="p-3.5 bg-red-50/80 border border-red-200/80 rounded-xl flex items-start gap-3 text-red-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">
              Are you sure you want to delete &quot;{supplier.supplier_name}&quot;?
            </p>
            {supplier.company_name && (
              <p className="text-red-700">Company: {supplier.company_name}</p>
            )}
            <p className="text-red-700 text-[11px] leading-relaxed">
              If this supplier has existing purchase orders, the deletion will be rejected to protect procurement audit history.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteSupplierModal;
