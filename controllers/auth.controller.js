const apiResponse = require("quick-response");
const User = require("../models/user.model");

// register user
const registration = async (req, res) => {
  try {
    const { userName, email, password, confirmPassword } = req.body;

    if (!userName || !email) {
      return res
        .status(400)
        .json(apiResponse(400, "username and email are required"));
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(apiResponse(400, "please enter same password"));
    }

    const userFound = await User.findOne({ $or: [{ email }, { userName }] });
    if (userFound) {
      return res.status(400).json(apiResponse(400, "user already exists"));
    }

    const user = await User.create({ userName, email, password });

    return res
      .status(201)
      .json(apiResponse(201, "user registration successfull", user));
  } catch (error) {
    return res.json(apiResponse(500, "server error", error.message));
  }
};

module.exports = { registration };
