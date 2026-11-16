const SupplierService = require('../services/supplierService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller for Supplier HTTP requests
 */
class SupplierController {
  /**
   * POST /api/suppliers
   * Create a new supplier
   */
  static async createSupplier(req, res, next) {
    try {
      const supplier = await SupplierService.createSupplier(req.organizationId, req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Supplier created successfully',
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/suppliers
   * List suppliers with pagination, search, and sorting
   */
  static async getSuppliers(req, res, next) {
    try {
      const result = await SupplierService.getSuppliers(req.organizationId, req.query);
      return successResponse(res, {
        statusCode: 200,
        message: 'Suppliers retrieved successfully',
        data: result.suppliers,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/suppliers/:id
   * Get an individual supplier by ID
   */
  static async getSupplierById(req, res, next) {
    try {
      const supplier = await SupplierService.getSupplierById(req.organizationId, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier retrieved successfully',
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/suppliers/:id
   * Update supplier details
   */
  static async updateSupplier(req, res, next) {
    try {
      const supplier = await SupplierService.updateSupplier(req.organizationId, req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier updated successfully',
        data: supplier
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/suppliers/:id
   * Delete supplier
   */
  static async deleteSupplier(req, res, next) {
    try {
      const result = await SupplierService.deleteSupplier(req.organizationId, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Supplier deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SupplierController;
