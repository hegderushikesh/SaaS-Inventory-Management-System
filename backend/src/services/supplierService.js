const { Op } = require('sequelize');
const { Supplier, PurchaseOrder } = require('../models');

/**
 * Service for Supplier business operations
 * Strictly enforces organization_id multi-tenant boundary.
 */
class SupplierService {
  /**
   * Create a new supplier for the authenticated organization
   */
  static async createSupplier(organizationId, supplierData) {
    const trimmedName = supplierData.supplier_name ? supplierData.supplier_name.trim() : '';

    if (!trimmedName) {
      const error = new Error('Supplier name is required.');
      error.statusCode = 400;
      throw error;
    }

    const supplier = await Supplier.create({
      organization_id: organizationId,
      supplier_name: trimmedName,
      company_name: supplierData.company_name ? supplierData.company_name.trim() : null,
      email: supplierData.email && supplierData.email.trim() !== '' ? supplierData.email.trim().toLowerCase() : null,
      phone: supplierData.phone ? supplierData.phone.trim() : null,
      address: supplierData.address ? supplierData.address.trim() : null,
      notes: supplierData.notes ? supplierData.notes.trim() : null
    });

    return supplier;
  }

  /**
   * Get paginated suppliers for an organization with optional search and sorting
   */
  static async getSuppliers(
    organizationId,
    { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = {}
  ) {
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    const whereConditions = {
      organization_id: organizationId
    };

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereConditions[Op.or] = [
        { supplier_name: { [Op.like]: searchTerm } },
        { company_name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { phone: { [Op.like]: searchTerm } }
      ];
    }

    const allowedSortColumns = ['supplier_name', 'company_name', 'email', 'created_at', 'updated_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Supplier.findAndCountAll({
      where: whereConditions,
      limit: parsedLimit,
      offset: offset,
      order: [[safeSortBy, safeSortOrder]]
    });

    const totalPages = Math.ceil(count / parsedLimit) || 1;

    return {
      suppliers: rows,
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
   * Get an individual supplier by ID ensuring organization ownership
   */
  static async getSupplierById(organizationId, supplierId) {
    const supplier = await Supplier.findOne({
      where: {
        id: supplierId,
        organization_id: organizationId
      },
      include: [
        {
          model: PurchaseOrder,
          as: 'purchase_orders',
          attributes: ['id', 'po_number', 'status', 'total_amount', 'order_date'],
          limit: 10,
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!supplier) {
      const error = new Error('Supplier not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    return supplier;
  }

  /**
   * Update supplier details
   */
  static async updateSupplier(organizationId, supplierId, updateData) {
    const supplier = await Supplier.findOne({
      where: {
        id: supplierId,
        organization_id: organizationId
      }
    });

    if (!supplier) {
      const error = new Error('Supplier not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    const fieldsToUpdate = {};

    if (updateData.supplier_name !== undefined) {
      fieldsToUpdate.supplier_name = updateData.supplier_name.trim();
    }
    if (updateData.company_name !== undefined) {
      fieldsToUpdate.company_name = updateData.company_name ? updateData.company_name.trim() : null;
    }
    if (updateData.email !== undefined) {
      fieldsToUpdate.email = updateData.email && updateData.email.trim() !== '' ? updateData.email.trim().toLowerCase() : null;
    }
    if (updateData.phone !== undefined) {
      fieldsToUpdate.phone = updateData.phone ? updateData.phone.trim() : null;
    }
    if (updateData.address !== undefined) {
      fieldsToUpdate.address = updateData.address ? updateData.address.trim() : null;
    }
    if (updateData.notes !== undefined) {
      fieldsToUpdate.notes = updateData.notes ? updateData.notes.trim() : null;
    }

    await supplier.update(fieldsToUpdate);
    return supplier;
  }

  /**
   * Delete a supplier ensuring organization ownership
   */
  static async deleteSupplier(organizationId, supplierId) {
    const supplier = await Supplier.findOne({
      where: {
        id: supplierId,
        organization_id: organizationId
      }
    });

    if (!supplier) {
      const error = new Error('Supplier not found or does not belong to your organization.');
      error.statusCode = 404;
      throw error;
    }

    // Check if supplier is linked to existing purchase orders
    const poCount = await PurchaseOrder.count({
      where: {
        supplier_id: supplierId,
        organization_id: organizationId
      }
    });

    if (poCount > 0) {
      const error = new Error(
        `Cannot delete supplier '${supplier.supplier_name}'. There are ${poCount} associated purchase order(s).`
      );
      error.statusCode = 400;
      throw error;
    }

    await supplier.destroy();
    return {
      id: supplierId,
      supplier_name: supplier.supplier_name,
      company_name: supplier.company_name
    };
  }
}

module.exports = SupplierService;
