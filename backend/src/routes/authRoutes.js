const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authMiddleware');

// Public authentication routes
router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);

// Protected routes (requires valid JWT token)
router.get('/me', authenticate, authController.getMe);

module.exports = router;
