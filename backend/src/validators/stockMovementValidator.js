const { body, param, query } = require('express-validator');

const validateCreateStockMovement = [
  body('product_id')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required.')
    .isUUID(4)
    .withMessage('Product ID must be a valid UUID.'),

  body('movement_type')
    .trim()
    .notEmpty()
    .withMessage('Movement type is required.')
    .toUpperCase()
    .isIn(['IN', 'OUT', 'ADJUSTMENT'])
    .withMessage("Movement type must be one of: 'IN', 'OUT', or 'ADJUSTMENT'."),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required.')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer greater than 0.'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason for stock movement is required.')
    .isLength({ min: 2, max: 255 })
    .withMessage('Reason must be between 2 and 255 characters.'),

  body('reference_number')
    .optional({ checkFalsy: false })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number cannot exceed 100 characters.'),

  body('adjustment_type')
    .optional({ checkFalsy: true })
    .trim()
    .toUpperCase()
    .isIn(['INCREASE', 'DECREASE'])
    .withMessage("Adjustment type must be either 'INCREASE' or 'DECREASE'."),

  body('new_quantity')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('New quantity must be a non-negative integer.')
];

const validateMovementId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Stock movement ID is required.')
    .isUUID(4)
    .withMessage('Invalid stock movement ID format.')
];

const validateProductIdParam = [
  param('productId')
    .trim()
    .notEmpty()
    .withMessage('Product ID is required.')
    .isUUID(4)
    .withMessage('Invalid product ID format.')
];

module.exports = {
  validateCreateStockMovement,
  validateMovementId,
  validateProductIdParam
};
