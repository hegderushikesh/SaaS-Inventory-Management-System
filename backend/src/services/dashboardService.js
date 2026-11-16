const { Op } = require('sequelize');
const { sequelize, Product, OrganizationSetting } = require('../models');

/**
 * Service for Dashboard Metrics and Low-Stock Calculations
 */
class DashboardService {
  /**
   * Calculate organization inventory summary and low stock alerts
   */
  static async getSummary(organizationId) {
    // 1. Retrieve organization settings for default low stock threshold
    const setting = await OrganizationSetting.findOne({
      where: { organization_id: organizationId }
    });
    const defaultThreshold = setting ? setting.default_low_stock_threshold : 5;

    // 2. Perform aggregation for totalProducts and totalStock
    const [summaryResult] = await Product.findAll({
      where: { organization_id: organizationId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalProducts'],
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quantity_on_hand')), 0), 'totalStock']
      ],
      raw: true
    });

    const totalProducts = parseInt(summaryResult?.totalProducts || 0, 10);
    const totalStock = parseInt(summaryResult?.totalStock || 0, 10);

    // 3. Query low stock products using effective threshold logic:
    // If product.low_stock_threshold is not null, use it; otherwise use defaultThreshold.
    const lowStockRecords = await Product.findAll({
      where: {
        organization_id: organizationId,
        [Op.and]: [
          sequelize.where(
            sequelize.col('quantity_on_hand'),
            '<=',
            sequelize.fn('COALESCE', sequelize.col('low_stock_threshold'), defaultThreshold)
          )
        ]
      },
      attributes: [
        'id',
        'name',
        'sku',
        'quantity_on_hand',
        'low_stock_threshold',
        [sequelize.fn('COALESCE', sequelize.col('low_stock_threshold'), defaultThreshold), 'effective_low_stock_threshold']
      ],
      order: [['quantity_on_hand', 'ASC']],
      raw: true
    });

    const lowStockProducts = lowStockRecords.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity_on_hand: item.quantity_on_hand,
      low_stock_threshold: item.low_stock_threshold,
      effective_low_stock_threshold: parseInt(item.effective_low_stock_threshold, 10)
    }));

    return {
      totalProducts,
      totalStock,
      lowStockCount: lowStockProducts.length,
      lowStockProducts
    };
  }
}

module.exports = DashboardService;
