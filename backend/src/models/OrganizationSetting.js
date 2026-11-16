const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrganizationSetting = sequelize.define(
  'OrganizationSetting',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    organization_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'organizations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    default_low_stock_threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: { args: [0], msg: 'Default low stock threshold cannot be negative.' }
      }
    }
  },
  {
    tableName: 'organization_settings',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['organization_id']
      }
    ]
  }
);

module.exports = OrganizationSetting;
