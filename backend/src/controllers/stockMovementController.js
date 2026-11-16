const StockMovementService = require('../services/stockMovementService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller for Stock Movement History HTTP requests
 */
class StockMovementController {
  /**
   * POST /api/stock-movements
   * Record a new stock movement and adjust inventory atomically
   */
  static async createMovement(req, res, next) {
    try {
      const result = await StockMovementService.recordMovement(
        req.organizationId,
        req.userId,
        req.body
      );

      return successResponse(res, {
        statusCode: 201,
        message: 'Stock movement recorded successfully',
        data: {
          movement: result.movement,
          product: {
            id: result.product.id,
            name: result.product.name,
            sku: result.product.sku,
            quantity_on_hand: result.product.quantity_on_hand
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stock-movements
   * List paginated stock movements with optional filtering
   */
  static async getMovements(req, res, next) {
    try {
      const result = await StockMovementService.getMovements(
        req.organizationId,
        req.query
      );

      return successResponse(res, {
        statusCode: 200,
        message: 'Stock movements retrieved successfully',
        data: result.movements,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stock-movements/:id
   * Get an individual stock movement by ID
   */
  static async getMovementById(req, res, next) {
    try {
      const movement = await StockMovementService.getMovementById(
        req.organizationId,
        req.params.id
      );

      return successResponse(res, {
        statusCode: 200,
        message: 'Stock movement retrieved successfully',
        data: movement
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/stock-movements/product/:productId
   * Get stock movements for a specific product
   */
  static async getMovementsByProduct(req, res, next) {
    try {
      const result = await StockMovementService.getMovementsByProduct(
        req.organizationId,
        req.params.productId,
        req.query
      );

      return successResponse(res, {
        statusCode: 200,
        message: 'Product stock movements retrieved successfully',
        data: result.movements,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StockMovementController;
