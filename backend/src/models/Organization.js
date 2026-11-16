const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Organization = sequelize.define(
  'Organization',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Organization name cannot be empty.' },
        len: { args: [2, 255], msg: 'Organization name must be between 2 and 255 characters.' }
      }
    }
  },
  {
    tableName: 'organizations',
    timestamps: true,
    underscored: true
  }
);

module.exports = Organization;
