const { sequelize } = require('../config/database');
const Organization = require('./Organization');
const OrganizationSetting = require('./OrganizationSetting');
const User = require('./User');
const Product = require('./Product');
const StockMovement = require('./StockMovement');

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

module.exports = {
  sequelize,
  Organization,
  OrganizationSetting,
  User,
  Product,
  StockMovement
};
