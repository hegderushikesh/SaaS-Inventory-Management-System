const { sequelize, User, Organization, OrganizationSetting } = require('../models');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Register a new user with their organization and default settings
 * Route: POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return errorResponse(res, {
        statusCode: 409,
        message: 'An account with this email address already exists.'
      });
    }

    // Atomic transaction for multi-tenant onboarding
    const { organization, settings, user } = await sequelize.transaction(async (t) => {
      // 1. Create Organization (Tenant)
      const newOrg = await Organization.create(
        {
          name: organizationName.trim()
        },
        { transaction: t }
      );

      // 2. Create Default Organization Settings
      const newSettings = await OrganizationSetting.create(
        {
          organization_id: newOrg.id,
          default_low_stock_threshold: 5
        },
        { transaction: t }
      );

      // 3. Create User linked to the Organization
      const newUser = await User.create(
        {
          name: name ? name.trim() : null,
          email: normalizedEmail,
          password_hash: password, // Automatically hashed in User model beforeCreate hook
          organization_id: newOrg.id
        },
        { transaction: t }
      );

      return {
        organization: newOrg,
        settings: newSettings,
        user: newUser
      };
    });

    // Generate JWT token with tenant context
    const token = generateToken({
      id: user.id,
      email: user.email,
      organization_id: organization.id,
      name: user.name
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Registration successful! Organization and account created.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization_id: organization.id,
          created_at: user.created_at
        },
        organization: {
          id: organization.id,
          name: organization.name,
          created_at: organization.created_at
        },
        settings: {
          id: settings.id,
          default_low_stock_threshold: settings.default_low_stock_threshold
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user and return JWT with tenant context
 * Route: POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email including the password_hash scope
    const user = await User.scope('withPassword').findOne({
      where: { email: normalizedEmail },
      include: [
        {
          model: Organization,
          as: 'organization',
          include: [
            {
              model: OrganizationSetting,
              as: 'settings'
            }
          ]
        }
      ]
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid email or password.'
      });
    }

    // Verify password with bcrypt
    const isPasswordValid = await user.validPassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid email or password.'
      });
    }

    if (!user.organization) {
      return errorResponse(res, {
        statusCode: 403,
        message: 'No associated organization found for this user account.'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      organization_id: user.organization.id,
      name: user.name
    });

    return successResponse(res, {
      statusCode: 200,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization_id: user.organization.id,
          created_at: user.created_at
        },
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          created_at: user.organization.created_at
        },
        settings: user.organization.settings
          ? {
              id: user.organization.settings.id,
              default_low_stock_threshold: user.organization.settings.default_low_stock_threshold
            }
          : { default_low_stock_threshold: 5 }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile and organization info
 * Route: GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: Organization,
          as: 'organization',
          include: [
            {
              model: OrganizationSetting,
              as: 'settings'
            }
          ]
        }
      ]
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: 'Authenticated user profile not found.'
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: 'Authenticated user profile retrieved.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organization_id: user.organization ? user.organization.id : null,
          created_at: user.created_at
        },
        organization: user.organization
          ? {
              id: user.organization.id,
              name: user.organization.name,
              created_at: user.organization.created_at
            }
          : null,
        settings: user.organization && user.organization.settings
          ? {
              id: user.organization.settings.id,
              default_low_stock_threshold: user.organization.settings.default_low_stock_threshold
            }
          : { default_low_stock_threshold: 5 }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
