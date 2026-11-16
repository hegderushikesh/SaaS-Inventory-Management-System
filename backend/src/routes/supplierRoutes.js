const express = require('express');
const router = express.Router();
const SupplierController = require('../controllers/supplierController');
const {
  createSupplierValidator,
  updateSupplierValidator,
  supplierIdValidator
} = require('../validators/supplierValidator');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authMiddleware');

// All supplier routes require an authenticated user & tenant context
router.use(authenticate);

// 1. Create supplier
router.post('/', createSupplierValidator, validate, SupplierController.createSupplier);

// 2. Get suppliers list with pagination and search
router.get('/', SupplierController.getSuppliers);

// 3. Get single supplier by ID
router.get('/:id', supplierIdValidator, validate, SupplierController.getSupplierById);

// 4. Update supplier details
router.put('/:id', updateSupplierValidator, validate, SupplierController.updateSupplier);

// 5. Delete supplier
router.delete('/:id', supplierIdValidator, validate, SupplierController.deleteSupplier);

module.exports = router;
