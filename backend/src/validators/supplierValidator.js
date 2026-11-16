const { body, param, query } = require('express-validator');

const createSupplierValidator = [
  body('supplier_name')
    .trim()
    .notEmpty()
    .withMessage('Supplier name is required.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Supplier name must be between 2 and 150 characters.'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number cannot exceed 50 characters.'),

  body('company_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Company name cannot exceed 150 characters.'),

  body('address')
    .optional({ checkFalsy: true })
    .trim(),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
];

const updateSupplierValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Supplier ID is required.')
    .isUUID(4)
    .withMessage('Invalid supplier ID format.'),

  body('supplier_name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Supplier name cannot be empty.')
    .isLength({ min: 2, max: 150 })
    .withMessage('Supplier name must be between 2 and 150 characters.'),

  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone number cannot exceed 50 characters.'),

  body('company_name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Company name cannot exceed 150 characters.'),

  body('address')
    .optional({ checkFalsy: true })
    .trim(),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
];

const supplierIdValidator = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Supplier ID is required.')
    .isUUID(4)
    .withMessage('Invalid supplier ID format.')
];

module.exports = {
  createSupplierValidator,
  updateSupplierValidator,
  supplierIdValidator
};
