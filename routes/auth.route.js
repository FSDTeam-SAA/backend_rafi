const { Router } = require("express");
const {
  registration,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/auth.controller')

const router = Router();

router.route("/register").post(registration);
router.route("/login").post(login);

router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/change-password', changePassword)
// router.post('/auth/verify-email', verifyEmail)
// router.post('/auth/resend-verification', resendVerificationEmail)

module.exports = router;
