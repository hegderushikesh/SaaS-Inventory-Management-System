const PurchaseOrderService = require('../services/purchaseOrderService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller for Purchase Order HTTP requests
 */
class PurchaseOrderController {
  /**
   * POST /api/purchase-orders
   * Create a new purchase order with supplier selection and items
   */
  static async createPurchaseOrder(req, res, next) {
    try {
      const po = await PurchaseOrderService.createPurchaseOrder(
        req.organizationId,
        req.userId,
        req.body
      );
      return successResponse(res, {
        statusCode: 201,
        message: 'Purchase order created successfully',
        data: po
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/purchase-orders
   * List purchase orders
   */
  static async getPurchaseOrders(req, res, next) {
    try {
      const result = await PurchaseOrderService.getPurchaseOrders(req.organizationId, req.query);
      return successResponse(res, {
        statusCode: 200,
        message: 'Purchase orders retrieved successfully',
        data: result.purchase_orders,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/purchase-orders/:id
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(req, res, next) {
    try {
      const po = await PurchaseOrderService.getPurchaseOrderById(req.organizationId, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Purchase order retrieved successfully',
        data: po
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PurchaseOrderController;
