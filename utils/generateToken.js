const User = require("../models/user.model");

const generateToken = async (id) => {
  try {
    const user = await User.findById({ _id: id });
    const token = await user.generateAccessToken();
    await user.save();
    return { token };
  } catch (error) {
    console.log(error);
  }
};

module.exports = generateToken;
