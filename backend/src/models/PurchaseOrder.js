const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrder = sequelize.define(
  'PurchaseOrder',
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
    supplier_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'suppliers',
        key: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    },
    po_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'ORDERED'
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expected_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    }
  },
  {
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['organization_id'],
        name: 'idx_po_org_id'
      },
      {
        fields: ['supplier_id'],
        name: 'idx_po_supplier_id'
      },
      {
        fields: ['status'],
        name: 'idx_po_status'
      },
      {
        fields: ['created_at'],
        name: 'idx_po_created_at'
      }
    ]
  }
);

module.exports = PurchaseOrder;
