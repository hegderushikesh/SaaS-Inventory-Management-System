const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const {
  createProductValidator,
  updateProductValidator,
  stockAdjustmentValidator,
  getProductsQueryValidator
} = require('../validators/productValidators');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authMiddleware');

// All product routes require an authenticated user & tenant context
router.use(authenticate);

// 1. Create product
router.post('/', createProductValidator, validate, ProductController.createProduct);

// 2. Get products list with pagination, search, and sorting
router.get('/', getProductsQueryValidator, validate, ProductController.getProducts);

// 3. Get single product by ID
router.get('/:id', ProductController.getProductById);

// 4. Update product details and stock quantity
router.put('/:id', updateProductValidator, validate, ProductController.updateProduct);

// 5. Delete product
router.delete('/:id', ProductController.deleteProduct);

// 6. Update / adjust stock quantity
router.patch('/:id/stock', stockAdjustmentValidator, validate, ProductController.adjustStock);

module.exports = router;
