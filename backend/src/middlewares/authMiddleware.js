const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/apiResponse');
const { User, Organization } = require('../models');

/**
 * Authentication & Tenant Context Middleware
 * Verifies JWT token, validates user existence in DB,
 * and attaches authenticated user context and organization_id.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Access denied. Malformed authorization token.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, {
          statusCode: 401,
          message: 'Authorization token has expired. Please log in again.'
        });
      }
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid authorization token.'
      });
    }

    // Ensure user still exists and belongs to the specified organization
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'User account associated with this token no longer exists.'
      });
    }

    if (!user.organization || user.organization.id !== decoded.organization_id) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'Cross-tenant access violation. Organization mismatch detected.'
      });
    }

    // Attach verified user and tenant context to request
    req.user = user;
    req.userId = user.id;
    req.organizationId = user.organization_id;
    req.organization_id = user.organization_id; // Support both naming styles

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return errorResponse(res, {
      statusCode: 500,
      message: 'Failed to authenticate user.'
    });
  }
};

module.exports = {
  authenticate
};
