const DashboardService = require('../services/dashboardService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller for Dashboard endpoints
 */
class DashboardController {
  /**
   * GET /api/dashboard/summary
   */
  static async getSummary(req, res, next) {
    try {
      const summary = await DashboardService.getSummary(req.organizationId);
      return successResponse(res, {
        statusCode: 200,
        message: 'Dashboard summary retrieved successfully',
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DashboardController;
