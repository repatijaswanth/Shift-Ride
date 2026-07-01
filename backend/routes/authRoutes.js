// authRoutes.js
const express = require('express');
const router  = express.Router();
const auth    = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

router.post('/register',  auth.register);
router.post('/login',     auth.login);
router.get ('/profile',   protect, auth.getProfile);

module.exports = router;
