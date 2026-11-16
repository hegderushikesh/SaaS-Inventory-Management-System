import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Building, Mail, Phone, MapPin, FileText, ArrowRight } from 'lucide-react';

import { Modal, Button, Input, Textarea } from '../ui';
import { supplierSchema } from '../../schemas/supplierSchemas';
import { useCreateSupplier, useUpdateSupplier } from '../../hooks/useSuppliers';

export const SupplierModal = ({ supplier = null, isOpen, onClose }) => {
  const isEditing = Boolean(supplier);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_name: '',
      company_name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    }
  });

  useEffect(() => {
    if (supplier) {
      reset({
        supplier_name: supplier.supplier_name || '',
        company_name: supplier.company_name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
    } else {
      reset({
        supplier_name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
    }
  }, [supplier, reset, isOpen]);

  const handleModalClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: supplier.id, data },
        {
          onSuccess: () => {
            handleModalClose();
          }
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          handleModalClose();
        }
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={isEditing ? `Edit Supplier: ${supplier?.supplier_name}` : 'Add New Supplier'}
      description={
        isEditing
          ? 'Update vendor contact information and terms.'
          : 'Register a vendor or partner in your organization directory.'
      }
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={handleModalClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            rightIcon={ArrowRight}
          >
            {isEditing ? 'Save Changes' : 'Create Supplier'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name and Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Supplier Name"
            required
            placeholder="e.g. John Doe / TechRep"
            error={errors.supplier_name?.message}
            leftIcon={User}
            {...register('supplier_name')}
          />

          <Input
            label="Company Name (Optional)"
            placeholder="e.g. TechLogix Distribution LLC"
            error={errors.company_name?.message}
            leftIcon={Building}
            {...register('company_name')}
          />
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="e.g. orders@supplier.com"
            error={errors.email?.message}
            leftIcon={Mail}
            {...register('email')}
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="e.g. +1 (555) 234-5678"
            error={errors.phone?.message}
            leftIcon={Phone}
            {...register('phone')}
          />
        </div>

        {/* Address */}
        <Textarea
          label="Physical Address / Location (Optional)"
          rows={2}
          placeholder="e.g. 100 Logistics Way, Suite 400, Chicago, IL 60601"
          error={errors.address?.message}
          {...register('address')}
        />

        {/* Notes */}
        <Textarea
          label="Vendor Notes & Terms (Optional)"
          rows={2}
          placeholder="e.g. Net 30 payment terms, 5-day delivery turnaround, primary contact on sales team"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};

export default SupplierModal;
