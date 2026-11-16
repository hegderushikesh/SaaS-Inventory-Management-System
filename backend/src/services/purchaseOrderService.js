const { Op } = require('sequelize');
const {
  sequelize,
  PurchaseOrder,
  PurchaseOrderItem,
  Supplier,
  Product,
  User,
  StockMovement
} = require('../models');

/**
 * Service for Purchase Order business operations
 * Strictly enforces organization_id multi-tenant boundary.
 */
class PurchaseOrderService {
  /**
   * Create a new purchase order with supplier selection and line items
   */
  static async createPurchaseOrder(organizationId, userId, poData) {
    const { supplier_id, po_number, order_date, expected_delivery_date, notes, items = [] } = poData;

    return await sequelize.transaction(async (t) => {
      // 1. Verify that the selected supplier belongs to the organization
      const supplier = await Supplier.findOne({
        where: {
          id: supplier_id,
          organization_id: organizationId
        },
        transaction: t
      });

      if (!supplier) {
        const error = new Error('Selected supplier does not exist or does not belong to your organization.');
        error.statusCode = 404;
        throw error;
      }

      if (!Array.isArray(items) || items.length === 0) {
        const error = new Error('Purchase order must include at least one product line item.');
        error.statusCode = 400;
        throw error;
      }

      // Generate clean PO Number if not provided
      const resolvedPoNumber = po_number && po_number.trim() !== ''
        ? po_number.trim()
        : `PO-${Date.now().toString().slice(-6)}`;

      // 2. Validate all products belong to the organization and compute costs
      let calculatedTotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          const error = new Error('Item quantity must be a positive integer greater than 0.');
          error.statusCode = 400;
          throw error;
        }

        const product = await Product.findOne({
          where: {
            id: item.product_id,
            organization_id: organizationId
          },
          transaction: t
        });

        if (!product) {
          const error = new Error(`Product with ID '${item.product_id}' was not found in your organization.`);
          error.statusCode = 404;
          throw error;
        }

        const unitCost = item.unit_cost !== undefined && item.unit_cost !== null && item.unit_cost !== ''
          ? parseFloat(item.unit_cost)
          : (product.cost_price ? parseFloat(product.cost_price) : 0);

        const totalCost = parseFloat((qty * unitCost).toFixed(2));
        calculatedTotal += totalCost;

        validatedItems.push({
          product_id: product.id,
          quantity: qty,
          unit_cost: unitCost,
          total_cost: totalCost
        });
      }

      // 3. Create the Purchase Order
      const newPo = await PurchaseOrder.create(
        {
          organization_id: organizationId,
          supplier_id: supplier.id,
          po_number: resolvedPoNumber,
          status: poData.status || 'ORDERED',
          order_date: order_date || new Date().toISOString().split('T')[0],
          expected_delivery_date: expected_delivery_date || null,
          total_amount: calculatedTotal,
          notes: notes ? notes.trim() : null,
          created_by: userId || null
        },
        { transaction: t }
      );

      // 4. Create line items
      for (const item of validatedItems) {
        await PurchaseOrderItem.create(
          {
            purchase_order_id: newPo.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost
          },
          { transaction: t }
        );
      }

      // 5. Fetch full PO record with relations
      const completePo = await PurchaseOrder.findOne({
        where: { id: newPo.id },
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'supplier_name', 'company_name', 'email', 'phone']
          },
          {
            model: PurchaseOrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'sku']
              }
            ]
          }
        ],
        transaction: t
      });

      return completePo;
    });
  }

  /**
   * Get paginated purchase orders with supplier and items
   */
  static async getPurchaseOrders(
    organizationId,
    { page = 1, limit = 10, supplier_id, status, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = {}
  ) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    const whereConditions = {
      organization_id: organizationId
    };

    if (supplier_id) {
      whereConditions.supplier_id = supplier_id;
    }

    if (status && status.trim() !== '') {
      whereConditions.status = status.toUpperCase().trim();
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions[Op.or] = [
        { po_number: { [Op.like]: term } },
        { '$supplier.supplier_name$': { [Op.like]: term } },
        { '$supplier.company_name$': { [Op.like]: term } }
      ];
    }

    const allowedSortColumns = ['po_number', 'order_date', 'total_amount', 'status', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplier_name', 'company_name', 'email', 'phone']
        },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            }
          ]
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
      purchase_orders: rows,
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
   * Get purchase order by ID
   */
  static async getPurchaseOrderById(organizationId, poId) {
    const po = await PurchaseOrder.findOne({
      where: {
        id: poId,
        organization_id: organizationId
      },
      include: [
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'supplier_name', 'company_name', 'email', 'phone', 'address']
        },
        {
          model: PurchaseOrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'quantity_on_hand']
            }
          ]
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!po) {
      const error = new Error('Purchase order not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    return po;
  }
}

module.exports = PurchaseOrderService;
