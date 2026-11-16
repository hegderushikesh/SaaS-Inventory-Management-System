import { z } from 'zod';

export const supplierSchema = z.object({
  supplier_name: z
    .string()
    .min(2, 'Supplier name must be at least 2 characters')
    .max(150, 'Supplier name cannot exceed 150 characters'),
  company_name: z
    .string()
    .max(150, 'Company name cannot exceed 150 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(150, 'Email cannot exceed 150 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Phone cannot exceed 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('')),
  notes: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
});

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Please select a product'),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1 unit'),
  unit_cost: z.coerce
    .number({ invalid_type_error: 'Cost must be a number' })
    .min(0, 'Cost cannot be negative')
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  po_number: z.string().max(50).optional().or(z.literal('')),
  order_date: z.string().optional().or(z.literal('')),
  expected_delivery_date: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  items: z.array(purchaseOrderItemSchema).min(1, 'Please add at least one product item')
});
