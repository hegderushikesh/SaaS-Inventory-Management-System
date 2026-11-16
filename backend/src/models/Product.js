const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required.' },
        len: { args: [2, 255], msg: 'Product name must be between 2 and 255 characters.' }
      }
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product SKU is required.' },
        len: { args: [1, 100], msg: 'SKU must be between 1 and 100 characters.' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    quantity_on_hand: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Quantity on hand cannot be negative.' }
      }
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Cost price cannot be negative.' }
      }
    },
    selling_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Selling price cannot be negative.' }
      }
    },
    low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Low stock threshold cannot be negative.' }
      }
    }
  },
  {
    tableName: 'products',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['organization_id', 'sku'],
        name: 'unique_org_sku'
      },
      {
        fields: ['organization_id'],
        name: 'idx_products_org_id'
      }
    ]
  }
);

module.exports = Product;
