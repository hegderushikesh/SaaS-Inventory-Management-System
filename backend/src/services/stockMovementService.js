const { Op } = require('sequelize');
const { sequelize, StockMovement, Product, User } = require('../models');

/**
 * Service for Stock Movement History operations
 * All operations strictly enforce organization_id multi-tenant boundary.
 */
class StockMovementService {
  /**
   * Record a new stock movement with atomic transaction and row locking
   */
  static async recordMovement(
    organizationId,
    userId,
    {
      product_id,
      movement_type,
      quantity,
      reason,
      reference_number = null,
      adjustment_type = null,
      new_quantity = null
    },
    externalTransaction = null
  ) {
    const execute = async (t) => {
      // 1. Fetch current product ensuring organization ownership and lock row
      const product = await Product.findOne({
        where: {
          id: product_id,
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

      const previousQuantity = product.quantity_on_hand;
      let calculatedNewQuantity;
      let resolvedQuantity = parseInt(quantity, 10);
      const normalizedType = (movement_type || '').toUpperCase().trim();

      if (!['IN', 'OUT', 'ADJUSTMENT'].includes(normalizedType)) {
        const error = new Error("Invalid movement type. Must be 'IN', 'OUT', or 'ADJUSTMENT'.");
        error.statusCode = 400;
        throw error;
      }

      // 2. Calculate new quantity based on movement type
      if (normalizedType === 'IN') {
        if (!resolvedQuantity || resolvedQuantity <= 0) {
          const error = new Error('Quantity must be a positive integer greater than 0.');
          error.statusCode = 400;
          throw error;
        }
        calculatedNewQuantity = previousQuantity + resolvedQuantity;
      } else if (normalizedType === 'OUT') {
        if (!resolvedQuantity || resolvedQuantity <= 0) {
          const error = new Error('Quantity must be a positive integer greater than 0.');
          error.statusCode = 400;
          throw error;
        }
        if (previousQuantity < resolvedQuantity) {
          const error = new Error(
            `Insufficient stock. Available quantity is ${previousQuantity}, cannot dispatch ${resolvedQuantity}.`
          );
          error.statusCode = 400;
          throw error;
        }
        calculatedNewQuantity = previousQuantity - resolvedQuantity;
      } else if (normalizedType === 'ADJUSTMENT') {
        // Handle ADJUSTMENT
        if (new_quantity !== null && new_quantity !== undefined && new_quantity !== '') {
          calculatedNewQuantity = parseInt(new_quantity, 10);
          if (isNaN(calculatedNewQuantity) || calculatedNewQuantity < 0) {
            const error = new Error('Target adjusted quantity must be a non-negative integer (0 or greater).');
            error.statusCode = 400;
            throw error;
          }
          resolvedQuantity = Math.abs(calculatedNewQuantity - previousQuantity);
        } else if (adjustment_type) {
          const normAdj = adjustment_type.toUpperCase().trim();
          if (!resolvedQuantity || resolvedQuantity <= 0) {
            const error = new Error('Adjustment quantity must be a positive integer greater than 0.');
            error.statusCode = 400;
            throw error;
          }
          if (normAdj === 'INCREASE') {
            calculatedNewQuantity = previousQuantity + resolvedQuantity;
          } else if (normAdj === 'DECREASE') {
            if (previousQuantity < resolvedQuantity) {
              const error = new Error(
                `Insufficient stock. Available quantity is ${previousQuantity}, cannot decrease by ${resolvedQuantity}.`
              );
              error.statusCode = 400;
              throw error;
            }
            calculatedNewQuantity = previousQuantity - resolvedQuantity;
          } else {
            const error = new Error("Adjustment type must be 'INCREASE' or 'DECREASE'.");
            error.statusCode = 400;
            throw error;
          }
        } else {
          // If no adjustment_type or new_quantity, resolvedQuantity must be positive
          if (!resolvedQuantity || resolvedQuantity <= 0) {
            const error = new Error("For 'ADJUSTMENT', specify adjustment_type ('INCREASE'/'DECREASE') or valid new_quantity.");
            error.statusCode = 400;
            throw error;
          }
          // Default to increase
          calculatedNewQuantity = previousQuantity + resolvedQuantity;
        }
      }

      // 3. Validate stock cannot become negative
      if (calculatedNewQuantity < 0) {
        const error = new Error('Stock quantity cannot become negative.');
        error.statusCode = 400;
        throw error;
      }

      // 4. Update product quantity
      await product.update(
        { quantity_on_hand: calculatedNewQuantity },
        { transaction: t }
      );

      // 5. Insert stock movement record
      const movement = await StockMovement.create(
        {
          organization_id: organizationId,
          product_id: product.id,
          movement_type: normalizedType,
          quantity: resolvedQuantity,
          previous_quantity: previousQuantity,
          new_quantity: calculatedNewQuantity,
          reason: (reason || 'Inventory stock movement').trim(),
          reference_number: reference_number ? reference_number.trim() : null,
          created_by: userId || null
        },
        { transaction: t }
      );

      return {
        movement,
        product
      };
    };

    if (externalTransaction) {
      return await execute(externalTransaction);
    }
    return await sequelize.transaction(execute);
  }

  /**
   * Get paginated stock movements for an organization with optional filters
   */
  static async getMovements(
    organizationId,
    {
      page = 1,
      limit = 10,
      product_id,
      movement_type,
      search = '',
      start_date,
      end_date,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = {}
  ) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    // Organization tenant filter
    const whereConditions = {
      organization_id: organizationId
    };

    if (product_id) {
      whereConditions.product_id = product_id;
    }

    if (movement_type && movement_type.trim() !== '') {
      whereConditions.movement_type = movement_type.toUpperCase().trim();
    }

    // Date range filter
    if (start_date || end_date) {
      whereConditions.created_at = {};
      if (start_date) {
        whereConditions.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        const endDateObj = new Date(end_date);
        endDateObj.setHours(23, 59, 59, 999);
        whereConditions.created_at[Op.lte] = endDateObj;
      }
    }

    // Search filter across reason, reference_number, product name, or product SKU
    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions[Op.or] = [
        { reason: { [Op.like]: term } },
        { reference_number: { [Op.like]: term } },
        { '$product.name$': { [Op.like]: term } },
        { '$product.sku$': { [Op.like]: term } }
      ];
    }

    const allowedSortColumns = ['created_at', 'quantity', 'movement_type', 'previous_quantity', 'new_quantity'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await StockMovement.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'quantity_on_hand', 'cost_price', 'selling_price']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parsedLimit,
      offset: offset,
      order: [[safeSortBy, safeSortOrder]],
      distinct: true
    });

    const totalPages = Math.ceil(count / parsedLimit) || 1;

    return {
      movements: rows,
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
   * Get individual stock movement by ID ensuring organization ownership
   */
  static async getMovementById(organizationId, movementId) {
    const movement = await StockMovement.findOne({
      where: {
        id: movementId,
        organization_id: organizationId
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'quantity_on_hand', 'cost_price', 'selling_price']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!movement) {
      const error = new Error('Stock movement record not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    return movement;
  }

  /**
   * Get stock movement history for a specific product
   */
  static async getMovementsByProduct(organizationId, productId, queryParams = {}) {
    // Verify product exists and belongs to the organization
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

    return await this.getMovements(organizationId, {
      ...queryParams,
      product_id: productId
    });
  }
}

module.exports = StockMovementService;
