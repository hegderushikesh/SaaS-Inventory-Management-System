const ProductService = require('../services/productService');
const { successResponse } = require('../utils/apiResponse');

/**
 * Controller for handling product HTTP requests
 */
class ProductController {
  /**
   * POST /api/products
   * Create a new product
   */
  static async createProduct(req, res, next) {
    try {
      const product = await ProductService.createProduct(req.organizationId, req.body);
      return successResponse(res, {
        statusCode: 201,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products
   * List products with pagination, search, and sorting
   */
  static async getProducts(req, res, next) {
    try {
      const result = await ProductService.getProducts(req.organizationId, req.query);
      return successResponse(res, {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/products/:id
   * Get product details
   */
  static async getProductById(req, res, next) {
    try {
      const product = await ProductService.getProductById(req.organizationId, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Product retrieved successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/products/:id
   * Update product details and stock quantity
   */
  static async updateProduct(req, res, next) {
    try {
      const product = await ProductService.updateProduct(req.organizationId, req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/products/:id
   * Delete product
   */
  static async deleteProduct(req, res, next) {
    try {
      const deleted = await ProductService.deleteProduct(req.organizationId, req.params.id);
      return successResponse(res, {
        statusCode: 200,
        message: 'Product deleted successfully',
        data: deleted
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/products/:id/stock
   * Adjust product stock level (INCREASE or DECREASE)
   */
  static async adjustStock(req, res, next) {
    try {
      const result = await ProductService.adjustStock(req.organizationId, req.params.id, req.body);
      return successResponse(res, {
        statusCode: 200,
        message: 'Stock quantity updated successfully',
        data: result.product,
        meta: result.adjustment
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
