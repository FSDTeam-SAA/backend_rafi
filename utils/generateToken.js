const User = require("../models/user.model");

 exports.generateToken = async (id) => {
  try {
    const user = await User.findById({ _id: id });
    const token = await User.generateAccessToken();
    await user.save();
    return { token };
  } catch (error) {
    console.log(error);
  }
};

