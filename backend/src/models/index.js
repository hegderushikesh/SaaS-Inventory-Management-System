const { sequelize } = require('../config/database');
const Organization = require('./Organization');
const OrganizationSetting = require('./OrganizationSetting');
const User = require('./User');
const Product = require('./Product');
const StockMovement = require('./StockMovement');
const Supplier = require('./Supplier');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');

// --- Associations ---

// Organization <-> User (1:N)
Organization.hasMany(User, {
  foreignKey: 'organization_id',
  as: 'users',
  onDelete: 'CASCADE'
});
User.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> Product (1:N)
Organization.hasMany(Product, {
  foreignKey: 'organization_id',
  as: 'products',
  onDelete: 'CASCADE'
});
Product.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> OrganizationSetting (1:1)
Organization.hasOne(OrganizationSetting, {
  foreignKey: 'organization_id',
  as: 'settings',
  onDelete: 'CASCADE'
});
OrganizationSetting.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Organization <-> StockMovement (1:N)
Organization.hasMany(StockMovement, {
  foreignKey: 'organization_id',
  as: 'stock_movements',
  onDelete: 'CASCADE'
});
StockMovement.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Product <-> StockMovement (1:N)
Product.hasMany(StockMovement, {
  foreignKey: 'product_id',
  as: 'stock_movements',
  onDelete: 'CASCADE'
});
StockMovement.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User <-> StockMovement (1:N)
User.hasMany(StockMovement, {
  foreignKey: 'created_by',
  as: 'stock_movements',
  onDelete: 'SET NULL'
});
StockMovement.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

// Organization <-> Supplier (1:N)
Organization.hasMany(Supplier, {
  foreignKey: 'organization_id',
  as: 'suppliers',
  onDelete: 'CASCADE'
});
Supplier.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// Supplier <-> PurchaseOrder (1:N)
Supplier.hasMany(PurchaseOrder, {
  foreignKey: 'supplier_id',
  as: 'purchase_orders',
  onDelete: 'RESTRICT'
});
PurchaseOrder.belongsTo(Supplier, {
  foreignKey: 'supplier_id',
  as: 'supplier'
});

// Organization <-> PurchaseOrder (1:N)
Organization.hasMany(PurchaseOrder, {
  foreignKey: 'organization_id',
  as: 'purchase_orders',
  onDelete: 'CASCADE'
});
PurchaseOrder.belongsTo(Organization, {
  foreignKey: 'organization_id',
  as: 'organization'
});

// PurchaseOrder <-> PurchaseOrderItem (1:N)
PurchaseOrder.hasMany(PurchaseOrderItem, {
  foreignKey: 'purchase_order_id',
  as: 'items',
  onDelete: 'CASCADE'
});
PurchaseOrderItem.belongsTo(PurchaseOrder, {
  foreignKey: 'purchase_order_id',
  as: 'purchase_order'
});

// Product <-> PurchaseOrderItem (1:N)
Product.hasMany(PurchaseOrderItem, {
  foreignKey: 'product_id',
  as: 'po_items',
  onDelete: 'RESTRICT'
});
PurchaseOrderItem.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product'
});

// User <-> PurchaseOrder (1:N)
User.hasMany(PurchaseOrder, {
  foreignKey: 'created_by',
  as: 'purchase_orders',
  onDelete: 'SET NULL'
});
PurchaseOrder.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator'
});

module.exports = {
  sequelize,
  Organization,
  OrganizationSetting,
  User,
  Product,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem
};
