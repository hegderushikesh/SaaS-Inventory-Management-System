const { errorResponse } = require('../utils/apiResponse');

/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error caught by global handler]:', err);

  // Sequelize Unique Constraint Error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'Field';
    return errorResponse(res, {
      statusCode: 409,
      message: `${field} must be unique. A record with this value already exists.`,
      errors: err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null
    });
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    return errorResponse(res, {
      statusCode: 400,
      message: 'Validation error in database schema.',
      errors: err.errors ? err.errors.map(e => ({ field: e.path, message: e.message })) : null
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid authorization token.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Authorization token has expired. Please log in again.'
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, {
    statusCode,
    message,
    errors: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `Resource not found on endpoint: ${req.method} ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
