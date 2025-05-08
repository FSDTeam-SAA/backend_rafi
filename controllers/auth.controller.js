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

// login user
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const userFound = await User.findOne({ email });
    if (!userFound) {
      return res.status(404).json(apiResponse(404, "user not found"));
    }
    // check user exist or not
    const isPasswordCorrect = await userFound.correctPassword(password);
    if (!isPasswordCorrect) {
      return res
        .status(404)
        .json(apiResponse(404, "wrong username and password"));
    }

    // generate access and refresh token
    const { accessToken, refreshToken } = await generateTokens(userFound._id);
    const loginToken = { accessToken, refreshToken };

    return res.status(200).json(
      apiResponse(200, "login succcessful", {
        user: userFound,
        token: {
          refreshToken: refreshToken,
          accessToken: accessToken,
        },
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(apiResponse(500, "server error", error.message));
  }
};

module.exports = { registration, login };
