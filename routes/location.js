const express = require('express');
const { body, validationResult } = require('express-validator');
const { broadcastLocationUpdate } = require('../socket/socketHandler');

const router = express.Router();

/**
 * POST /api/location/update
 * Receives location updates from Laravel backend
 * Query params: package_status (optional) - if provided, only broadcasts to merchant if status is "on_the_way"
 */
router.post('/update', [
  body('rider_id').isInt().withMessage('rider_id must be an integer'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rider_id, latitude, longitude, package_id, last_update } = req.body;
    const packageStatus = req.query.package_status || null;

    // Broadcast location update via Socket.io
    broadcastLocationUpdate({
      rider_id,
      latitude,
      longitude,
      package_id: package_id || null,
      package_status: packageStatus,
      timestamp: last_update || new Date().toISOString()
    });

    res.json({ 
      message: 'Location update received and broadcasted',
      rider_id,
      package_id: package_id || null
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to process location update' });
  }
});

module.exports = router;
