const { sequelize } = require('../config/database');
const Organization = require('./Organization');
const OrganizationSetting = require('./OrganizationSetting');
const User = require('./User');
const Product = require('./Product');

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

module.exports = {
  sequelize,
  Organization,
  OrganizationSetting,
  User,
  Product
};
