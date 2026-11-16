const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware that inspects express-validator results
 * Returns a standardized 400 Bad Request error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return errorResponse(res, {
      statusCode: 400,
      message: 'Validation failed. Please check the submitted fields.',
      errors: formattedErrors
    });
  }
  next();
};

module.exports = validate;
