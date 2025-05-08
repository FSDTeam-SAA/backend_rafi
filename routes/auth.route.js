const { Router } = require("express");
const { registration } = require("../controllers/auth.controller");

const router = Router();

router.route("/register").post(registration);

module.exports = router;
