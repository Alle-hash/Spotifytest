const express = require('express');
const router = express.Router();
const conversionController = require('../controllers/conversionController');

// Start a new conversion job
router.post('/convert/start', conversionController.startConversion);

// Get conversion job status
router.get('/convert/status/:jobId', conversionController.getConversionStatus);

module.exports = router;
