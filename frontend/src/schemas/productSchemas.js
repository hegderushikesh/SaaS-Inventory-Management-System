import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .min(2, 'Product name must be at least 2 characters')
    .max(255, 'Product name cannot exceed 255 characters'),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100, 'SKU cannot exceed 100 characters'),
  quantity_on_hand: z.coerce
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(0, 'Quantity cannot be negative'),
  cost_price: z.coerce
    .number({ invalid_type_error: 'Cost price must be a number' })
    .min(0, 'Cost price cannot be negative')
    .optional()
    .nullable()
    .or(z.literal('')),
  selling_price: z.coerce
    .number({ invalid_type_error: 'Selling price must be a number' })
    .min(0, 'Selling price cannot be negative')
    .optional()
    .nullable()
    .or(z.literal('')),
  low_stock_threshold: z.coerce
    .number({ invalid_type_error: 'Threshold must be a number' })
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .optional()
    .nullable()
    .or(z.literal('')),
  description: z
    .string()
    .optional()
    .nullable()
});

export const adjustStockSchema = z.object({
  adjustment_type: z.enum(['INCREASE', 'DECREASE'], {
    required_error: 'Please select an adjustment type'
  }),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a positive number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1'),
  note: z
    .string()
    .max(255, 'Note cannot exceed 255 characters')
    .optional()
});

export const recordMovementSchema = z.object({
  product_id: z
    .string({ required_error: 'Please select a product' })
    .min(1, 'Please select a product'),
  movement_type: z.enum(['IN', 'OUT', 'ADJUSTMENT'], {
    required_error: 'Please select a movement type'
  }),
  adjustment_type: z
    .enum(['INCREASE', 'DECREASE'])
    .optional()
    .nullable(),
  quantity: z.coerce
    .number({ invalid_type_error: 'Quantity must be a positive integer' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1 unit'),
  reason: z
    .string({ required_error: 'Reason for movement is required' })
    .min(2, 'Reason must be at least 2 characters')
    .max(255, 'Reason cannot exceed 255 characters'),
  reference_number: z
    .string()
    .max(100, 'Reference number cannot exceed 100 characters')
    .optional()
    .nullable()
    .or(z.literal(''))
});
