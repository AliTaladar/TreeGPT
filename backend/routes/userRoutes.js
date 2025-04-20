const express = require('express');
const router = express.Router();
const { register, login, getUserProfile } = require('../controllers/authController');
const jwtMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', jwtMiddleware, getUserProfile);

module.exports = router;