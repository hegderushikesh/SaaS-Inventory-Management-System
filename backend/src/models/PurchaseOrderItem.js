const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrderItem = sequelize.define(
  'PurchaseOrderItem',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    purchase_order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'purchase_orders',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1.' }
      }
    },
    unit_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  },
  {
    tableName: 'purchase_order_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['purchase_order_id'],
        name: 'idx_poi_po_id'
      },
      {
        fields: ['product_id'],
        name: 'idx_poi_product_id'
      }
    ]
  }
);

module.exports = PurchaseOrderItem;
