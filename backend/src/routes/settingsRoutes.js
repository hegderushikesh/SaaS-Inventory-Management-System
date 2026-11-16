const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const { updateSettingsValidator } = require('../validators/settingsValidators');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// GET /api/settings
router.get('/', SettingsController.getSettings);

// PUT /api/settings
router.put('/', updateSettingsValidator, validate, SettingsController.updateSettings);

module.exports = router;
