const express = require('express');
const router  = express.Router();
const ride    = require('../controllers/rideController');
const protect = require('../middleware/authMiddleware');

router.post  ('/create',            protect, ride.createRide);
router.post  ('/join',              protect, ride.joinRide);
router.get   ('/active',            protect, ride.getActiveRides);
router.get   ('/match',             protect, ride.findMatchingRides);
router.get   ('/my-rides',          protect, ride.getMyRides);
router.get   ('/savings',           protect, ride.getSavings);
router.post  ('/location',          protect, ride.updateLocation);
router.patch ('/complete/:rideId',  protect, ride.completeRide);

module.exports = router;
