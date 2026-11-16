const { Op } = require('sequelize');
const { sequelize, Product } = require('../models');

/**
 * Service for Product and Inventory business operations
 * All operations strictly enforce organization_id multi-tenant boundary.
 */
class ProductService {
  /**
   * Create a new product for the authenticated organization
   */
  static async createProduct(organizationId, productData) {
    const trimmedSku = productData.sku.trim();

    // Check SKU uniqueness within the organization
    const existing = await Product.findOne({
      where: {
        organization_id: organizationId,
        sku: trimmedSku
      }
    });

    if (existing) {
      const error = new Error(`SKU '${trimmedSku}' already exists in your organization.`);
      error.statusCode = 409;
      throw error;
    }

    const newProduct = await Product.create({
      organization_id: organizationId,
      name: productData.name.trim(),
      sku: trimmedSku,
      description: productData.description ? productData.description.trim() : null,
      quantity_on_hand: parseInt(productData.quantity_on_hand, 10) || 0,
      cost_price: productData.cost_price !== undefined && productData.cost_price !== '' && productData.cost_price !== null
        ? parseFloat(productData.cost_price)
        : null,
      selling_price: productData.selling_price !== undefined && productData.selling_price !== '' && productData.selling_price !== null
        ? parseFloat(productData.selling_price)
        : null,
      low_stock_threshold: productData.low_stock_threshold !== undefined && productData.low_stock_threshold !== '' && productData.low_stock_threshold !== null
        ? parseInt(productData.low_stock_threshold, 10)
        : null
    });

    return newProduct;
  }

  /**
   * Get paginated products for an organization with optional search and sorting
   */
  static async getProducts(organizationId, { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    // Strict multi-tenant where condition
    const whereConditions = {
      organization_id: organizationId
    };

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereConditions[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { sku: { [Op.like]: searchTerm } }
      ];
    }

    // Allowed sort columns
    const allowedSortColumns = ['name', 'sku', 'quantity_on_hand', 'cost_price', 'selling_price', 'created_at', 'updated_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Product.findAndCountAll({
      where: whereConditions,
      limit: parsedLimit,
      offset: offset,
      order: [[safeSortBy, safeSortOrder]]
    });

    const totalPages = Math.ceil(count / parsedLimit) || 1;

    return {
      products: rows,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1
      }
    };
  }

  /**
   * Get a single product by ID ensuring organization ownership
   */
  static async getProductById(organizationId, productId) {
    const product = await Product.findOne({
      where: {
        id: productId,
        organization_id: organizationId
      }
    });

    if (!product) {
      const error = new Error('Product not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    return product;
  }

  /**
   * Update product details and stock quantity
   */
  static async updateProduct(organizationId, productId, updateData) {
    const product = await Product.findOne({
      where: {
        id: productId,
        organization_id: organizationId
      }
    });

    if (!product) {
      const error = new Error('Product not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    // If SKU is being updated, verify uniqueness within this organization
    if (updateData.sku && updateData.sku.trim() !== product.sku) {
      const trimmedSku = updateData.sku.trim();
      const existingSku = await Product.findOne({
        where: {
          organization_id: organizationId,
          sku: trimmedSku,
          id: { [Op.ne]: productId }
        }
      });

      if (existingSku) {
        const error = new Error(`SKU '${trimmedSku}' is already in use by another product in your organization.`);
        error.statusCode = 409;
        throw error;
      }
    }

    const fieldsToUpdate = {};

    if (updateData.name !== undefined) fieldsToUpdate.name = updateData.name.trim();
    if (updateData.sku !== undefined) fieldsToUpdate.sku = updateData.sku.trim();
    if (updateData.description !== undefined) fieldsToUpdate.description = updateData.description ? updateData.description.trim() : null;
    if (updateData.quantity_on_hand !== undefined) fieldsToUpdate.quantity_on_hand = parseInt(updateData.quantity_on_hand, 10);
    if (updateData.cost_price !== undefined) {
      fieldsToUpdate.cost_price = updateData.cost_price !== '' && updateData.cost_price !== null ? parseFloat(updateData.cost_price) : null;
    }
    if (updateData.selling_price !== undefined) {
      fieldsToUpdate.selling_price = updateData.selling_price !== '' && updateData.selling_price !== null ? parseFloat(updateData.selling_price) : null;
    }
    if (updateData.low_stock_threshold !== undefined) {
      fieldsToUpdate.low_stock_threshold = updateData.low_stock_threshold !== '' && updateData.low_stock_threshold !== null ? parseInt(updateData.low_stock_threshold, 10) : null;
    }

    await product.update(fieldsToUpdate);
    return product;
  }

  /**
   * Delete a product ensuring organization ownership
   */
  static async deleteProduct(organizationId, productId) {
    const product = await Product.findOne({
      where: {
        id: productId,
        organization_id: organizationId
      }
    });

    if (!product) {
      const error = new Error('Product not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    await product.destroy();
    return { id: productId, name: product.name, sku: product.sku };
  }

  /**
   * Atomic stock adjustment (INCREASE or DECREASE) using row-level locking
   */
  static async adjustStock(organizationId, productId, { adjustment_type, quantity, note = null }) {
    const adjQty = parseInt(quantity, 10);
    const normalizedType = adjustment_type.toUpperCase().trim();

    return await sequelize.transaction(async (t) => {
      // Row lock the product record for atomic update
      const product = await Product.findOne({
        where: {
          id: productId,
          organization_id: organizationId
        },
        lock: t.LOCK.UPDATE,
        transaction: t
      });

      if (!product) {
        const error = new Error('Product not found or does not belong to your organization.');
        error.statusCode = 404;
        throw error;
      }

      let newQuantity;
      if (normalizedType === 'INCREASE') {
        newQuantity = product.quantity_on_hand + adjQty;
      } else if (normalizedType === 'DECREASE') {
        if (product.quantity_on_hand < adjQty) {
          const error = new Error(
            `Insufficient stock. Current stock is ${product.quantity_on_hand}, cannot decrease by ${adjQty}.`
          );
          error.statusCode = 400;
          throw error;
        }
        newQuantity = product.quantity_on_hand - adjQty;
      } else {
        const error = new Error("Invalid adjustment type. Must be 'INCREASE' or 'DECREASE'.");
        error.statusCode = 400;
        throw error;
      }

      await product.update(
        { quantity_on_hand: newQuantity },
        { transaction: t }
      );

      return {
        product,
        adjustment: {
          type: normalizedType,
          quantity: adjQty,
          previous_quantity: product.quantity_on_hand,
          new_quantity: newQuantity,
          note
        }
      };
    });
  }
}

module.exports = ProductService;
