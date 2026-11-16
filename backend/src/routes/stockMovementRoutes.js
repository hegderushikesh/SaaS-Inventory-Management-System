const express = require('express');
const router = express.Router();
const StockMovementController = require('../controllers/stockMovementController');
const {
  validateCreateStockMovement,
  validateMovementId,
  validateProductIdParam
} = require('../validators/stockMovementValidator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authMiddleware');

// All stock movement routes require authentication and tenant context
router.use(authenticate);

// 1. POST /api/stock-movements - Record a stock movement
router.post(
  '/',
  validateCreateStockMovement,
  validate,
  StockMovementController.createMovement
);

// 2. GET /api/stock-movements - Get paginated stock movements with filters
router.get(
  '/',
  StockMovementController.getMovements
);

// 3. GET /api/stock-movements/:id - Get individual stock movement by ID
router.get(
  '/:id',
  validateMovementId,
  validate,
  StockMovementController.getMovementById
);

// 4. GET /api/stock-movements/product/:productId - Get movements for a specific product
router.get(
  '/product/:productId',
  validateProductIdParam,
  validate,
  StockMovementController.getMovementsByProduct
);

module.exports = router;
