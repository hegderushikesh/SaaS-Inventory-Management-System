const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define(
  'StockMovement',
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
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'ADJUSTMENT'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['IN', 'OUT', 'ADJUSTMENT']],
          msg: "Movement type must be 'IN', 'OUT', or 'ADJUSTMENT'."
        }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [1],
          msg: 'Quantity must be a positive integer of at least 1.'
        }
      }
    },
    previous_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    new_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'Stock quantity cannot become negative.'
        }
      }
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Reason for stock movement is required.'
        }
      }
    },
    reference_number: {
      type: DataTypes.STRING(100),
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
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    tableName: 'stock_movements',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
    underscored: true
  }
);

module.exports = StockMovement;
