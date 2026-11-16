const { body } = require('express-validator');

const updateSettingsValidator = [
  body('default_low_stock_threshold')
    .notEmpty()
    .withMessage('Default low stock threshold is required.')
    .isInt({ min: 0 })
    .withMessage('Default low stock threshold must be a non-negative integer (0 or greater).')
];

module.exports = {
  updateSettingsValidator
};
