const { Router } = require("express");
const { registration, login } = require("../controllers/auth.controller");

const router = Router();

router.route("/register").post(registration);
router.route("/login").post(login);

module.exports = router;
