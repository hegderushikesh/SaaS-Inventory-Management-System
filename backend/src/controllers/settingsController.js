const SettingsService = require('../services/settingsService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller for Organization Settings
 */
class SettingsController {
  /**
   * GET /api/settings
   */
  static async getSettings(req, res, next) {
    try {
      const settings = await SettingsService.getSettings(req.organizationId);
      return successResponse(res, {
        statusCode: 200,
        message: 'Organization settings retrieved successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/settings
   */
  static async updateSettings(req, res, next) {
    try {
      const settings = await SettingsService.updateSettings(req.organizationId, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Organization settings updated successfully',
        data: settings
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SettingsController;
