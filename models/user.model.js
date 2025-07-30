const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "user", "influencer"],
      default: "user",
    },
    address: {
      type: String,
    },
    followers: {
      type: Number,
      default: 0
    },
    refferCode: {
      type: String,
      unique: true
    },
    verificationInfo: {
      verified: { type: Boolean, default: false },
      token: { type: String, default: '' },
    },
    refferCount: {
      type: Number,
      default: 0
    },
    password_reset_token: {
      type: String,
    },
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    // const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// check password is correct or not
userSchema.methods.correctPassword = async function (userPassword) {
  return await bcrypt.compare(userPassword, this.password);
};

// generate token
userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      fullName: this.fullName,
      role: this.role,
    },
    accessTokenSecret,
    { expiresIn: accessTokenExpires }
  );
};

// jwt token verification
userSchema.methods.verifyAccessToken = async function (token) {
  return jwt.verify(token, accessTokenSecret, function (err, decoded) {
    if (err) {
      return null;
    }
    return decoded;
  });
};

userSchema.methods.isOTPVerified = async function (id) {
  const user = await User.findById(id).select('+verificationInfo')
  return user?.verificationInfo.verified
}

const User = mongoose.model("User", userSchema);

module.exports = User;
