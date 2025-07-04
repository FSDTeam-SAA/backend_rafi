const { Router } = require("express");
const {
  registration,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  verifyOtp,
  verifyEmail,
} = require('../controllers/auth.controller')
const { protect } = require("../middlewares/auth.middleware");

const router = Router();

router.route("/register").post(registration);
router.route("/login").post(login);

router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', changePassword)
router.post('/log-out',protect, logout)
router.post('/verify-otp', verifyOtp)
router.post('/verify-email', verifyEmail)

module.exports = router;
