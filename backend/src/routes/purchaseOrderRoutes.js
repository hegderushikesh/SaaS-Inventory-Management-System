const express = require('express');
const router = express.Router();
const PurchaseOrderController = require('../controllers/purchaseOrderController');
const { authenticate } = require('../middlewares/authMiddleware');

// All purchase order routes require an authenticated user & tenant context
router.use(authenticate);

// 1. Create purchase order with supplier selection
router.post('/', PurchaseOrderController.createPurchaseOrder);

// 2. Get purchase orders list
router.get('/', PurchaseOrderController.getPurchaseOrders);

// 3. Get single purchase order by ID
router.get('/:id', PurchaseOrderController.getPurchaseOrderById);

module.exports = router;
