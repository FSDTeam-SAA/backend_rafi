const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ succes: false, message: "Unauthorized" });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // console.log(decoded)
    const user = await User.findById(decoded._id)
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    console.log( err.message )
    return res.status(401).json({ succes: false, message: "Unauthorized" });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ succes: false, message: "Access denied. You are not an admin." });
  }
  next();
};