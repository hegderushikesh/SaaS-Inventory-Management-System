const { body, query, param } = require('express-validator');

const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required.')
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters.'),

  body('sku')
    .trim()
    .notEmpty()
    .withMessage('SKU is required.')
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1 and 100 characters.'),

  body('quantity_on_hand')
    .notEmpty()
    .withMessage('Quantity on hand is required.')
    .isInt({ min: 0 })
    .withMessage('Quantity on hand must be a non-negative integer (0 or greater).'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be text.'),

  body('cost_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a non-negative number.'),

  body('selling_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number.'),

  body('low_stock_threshold')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      if (!Number.isInteger(Number(val)) || Number(val) < 0) {
        throw new Error('Low stock threshold must be a non-negative integer or null.');
      }
      return true;
    })
];

const updateProductValidator = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required.'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Product name must be between 2 and 255 characters.'),

  body('sku')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('SKU must be between 1 and 100 characters.'),

  body('quantity_on_hand')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity on hand must be a non-negative integer (0 or greater).'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be text.'),

  body('cost_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a non-negative number.'),

  body('selling_price')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a non-negative number.'),

  body('low_stock_threshold')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      if (!Number.isInteger(Number(val)) || Number(val) < 0) {
        throw new Error('Low stock threshold must be a non-negative integer or null.');
      }
      return true;
    })
];

const stockAdjustmentValidator = [
  param('id')
    .notEmpty()
    .withMessage('Product ID is required.'),

  body('adjustment_type')
    .trim()
    .toUpperCase()
    .isIn(['INCREASE', 'DECREASE'])
    .withMessage("adjustment_type must be either 'INCREASE' or 'DECREASE'."),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer greater than 0.'),

  body('note')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Note must not exceed 255 characters.')
];

const getProductsQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100.'),

  query('search')
    .optional()
    .trim()
    .isString(),

  query('sortBy')
    .optional()
    .isIn(['name', 'sku', 'quantity_on_hand', 'selling_price', 'cost_price', 'created_at', 'updated_at'])
    .withMessage('Invalid sortBy field.'),

  query('sortOrder')
    .optional()
    .toUpperCase()
    .isIn(['ASC', 'DESC'])
    .withMessage('sortOrder must be ASC or DESC.')
];

module.exports = {
  createProductValidator,
  updateProductValidator,
  stockAdjustmentValidator,
  getProductsQueryValidator
};
