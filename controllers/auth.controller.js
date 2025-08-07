const apiResponse = require('quick-response')
const User = require('../models/user.model')
const { generateToken } = require('../utils/generateToken')
const { createToken } = require('../utils/authToken')
const jwt = require('jsonwebtoken')
const { sendMail } = require('../config/mailer')
const bcrypt = require('bcrypt')
const { sendResponse } = require('./subscriptionPlan.controller')




// register user
const registration = async (req, res) => {
  try {
    const { userName, phoneNumber, email, password, confirmPassword } = req.body

    if (!userName || !email) {
      return res
        .status(400)
        .json(apiResponse(400, 'username and email are required'))
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json(apiResponse(400, 'please enter same password'))
    }

    const userFound = await User.findOne({ $or: [{ email }, { userName }] })
    if (userFound) {
      return res.status(400).json(apiResponse(400, `user already exists on this email ${email}`))
    }
    const otp = generateOTP();
    const jwtPayloadOTP = {
      otp: otp,
    };

    const otptoken = createToken(
      jwtPayloadOTP,
      process.env.OTP_SECRET,
      process.env.OTP_EXPIRE
    );
    
    const user = await User.create({ userName, email, password, phoneNumber,verificationInfo: { token: otptoken, verified: false }, fullName: userName })
    await sendMail(user.email, "Registerd Account", `Your OTP is ${otp}`);

    return res
      .status(201)
      .json(apiResponse(201, `user registration successfull with the email ${email}`, user))
  } catch (error) {
    return res.json(apiResponse(500, 'server error', error.message))
  }
}

// login user
const login = async (req, res) => {
  const { email, password, gLogin, name,profilePhoto } = req.body
  try {
    const userFound = await User.findOne({ email })
    if (!userFound && !gLogin) {
      return res.status(404).json(apiResponse(404, 'user not found'))
    }

    if (gLogin) {
      let user1 = userFound


      const pass = generateOTP()


      if (!userFound) {
        user1 = await User.create({
          userName: name,
          email: email,
          password: pass,
          profilePhoto,
          fullName: name,
        })

        await sendMail(
          user1.email,
          'Registerd Account',
          `Your Password is ${pass}`
        )
      }

      const jwtPayload = {
        _id: user1._id,
        email: user1.email,
        role: user1.role,
      }
      const accessToken = createToken(
        jwtPayload,
        process.env.JWT_ACCESS_SECRET,
        process.env.JWT_ACCESS_EXPIRES_IN
      )
      const refreshToken = createToken(
        jwtPayload,
        process.env.JWT_REFRESH_SECRET,
        process.env.JWT_REFRESH_EXPIRES_IN
      )

      // let _user = await user1.save()
          user1.refreshToken = refreshToken
          user1.profilePhoto = profilePhoto ? profilePhoto : user1.profilePhoto
          await user1.save()

      // res.status(200).json({
      //   success: true,
      //   message: 'User Logged in successfully',
      //   data: {
      //     accessToken,
      //     role: user1.role,
      //     _id: user1._id,
      //   },
      // })
      return res.status(200).json(
        apiResponse(200, 'login successful', {
          user: user1,
          token: {
            accessToken: accessToken,
            refreshToken: refreshToken,
          },
        })
      )
    }

      if (!(await userFound.isOTPVerified(userFound._id))) {
    const otp = generateOTP();
    const jwtPayloadOTP = {
      otp: otp,
    };

    const otptoken = createToken(
      jwtPayloadOTP,
      process.env.OTP_SECRET,
      process.env.OTP_EXPIRE
    );
    userFound.verificationInfo.token = otptoken;
    await userFound.save();
    await sendMail(userFound.email, "Registerd Account", `Your OTP is ${otp}`);

    // return sendResponse(res, {
    //   statusCode: 400,
    //   success: false,
    //   message: "OTP is not verified, please verify your OTP",
    //   data: { email: userFound.email },
    // });
    return res.status (400).json({
      success: false,
      message: "OTP is not verified, please verify your OTP",
      })
  }

    // check user exist or not
    const isPasswordCorrect = await userFound.correctPassword(password)
    if (!isPasswordCorrect) {
      return res
        .status(404)
        .json(apiResponse(404, 'wrong username and password'))
    }

    const jwtPayload = {
      _id: userFound._id,
      email: userFound.email,
      role: userFound.role,
    }
    const accessToken = createToken(
      jwtPayload,
      process.env.JWT_ACCESS_SECRET,
      process.env.JWT_ACCESS_EXPIRES_IN
    )

    const refreshToken = createToken(
      jwtPayload,
      process.env.JWT_REFRESH_SECRET,
      process.env.JWT_REFRESH_EXPIRES_IN
    )
    userFound.refreshToken = refreshToken
    await userFound.save()

    return res.status(200).json(
      apiResponse(200, 'login successful', {
        user: userFound,
        token: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      })
    )
  } catch (error) {
    return res.status(500).json(apiResponse(500, 'server error', error.message))
  }
}

const generateOTP = () => {

  // Declare a digits variable  
  // which stores all digits 
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

// forget password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).json({ success: false, message: `User not associated with this email ${email}` })
      return
    }



    const otp = generateOTP()
    const jwtPayloadOTP = {
      otp: otp,
    };

    const token = jwt.sign(jwtPayloadOTP, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '50h',
    })
    user.password_reset_token = token
    await user.save()

    await sendMail(
      email,
      'Reset your password',
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your Password</title>
        <style>
          body {
            background-color: #f4f4f4;
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            background: #4caf50;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 30px;
            text-align: center;
          }
          .btn {
            display: inline-block;
            margin-top: 20px;
            background: #4caf50;
            color: #ffffff !important;
            padding: 12px 25px;
            text-decoration: none;
            border-radius: 4px;
          }
          .footer {
            background: #f4f4f4;
            color: #777;
            text-align: center;
            padding: 15px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You recently requested to reset your password. Here is Your OTP:</p>
            <h1>${otp}</h1>
            <p>If you didn’t request this, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
      `
    )

    res
      .status(200)
      .json({ success: true, message: `OTP Is Send in your email ${email}` })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fail to send password reset link',
    })
  }
}

// verify otp
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and OTP are required!' })
    }

    const user = await User.findOne({ email })
    if (!user || !user.password_reset_token) {
      return res
        .status(404)
        .json({ success: false, message: 'Invalid token or user not found' })
    }

    const decoded = jwt.decode(
      user.password_reset_token,
      process.env.JWT_ACCESS_SECRET
    )
    if (!decoded || decoded.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    return res.json({ success: true, message: 'OTP verified' })
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to verify OTP' })
  }
}

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  const user  = await User.findOne({email: email});
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
  }
  if (user.verificationInfo.verified) {
    res.status(400).json({ success: false, message: 'Email already verified' });
  }
  if (otp) {
    const savedOTP = jwt.decode(
      user.verificationInfo.token,
      process.env.OTP_SECRET
    );
    console.log(savedOTP);
    if (otp === savedOTP.otp) {
      user.verificationInfo.verified = true;
      user.verificationInfo.token = "";
      await user.save();

      // sendResponse(res, {
      //   statusCode: httpStatus.OK,
      //   success: true,
      //   message: "User verified",
      //   data: "",
      // });
      return res.status(200).json({ success: true, message: 'Email verified' });
    } else {
      // throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } else {
    // throw new AppError(httpStatus.BAD_REQUEST, "OTP is required");
    return res.status(400).json({ success: false, message: 'OTP is required'})
  }
}


// reset password
// const resetPassword = async (req, res) => {
//   try {
//     const { email,otp, password } = req.body

//     if (!email || !otp || !password) {
//       res
//         .statusA(404)
//         .json({ success: false, message: 'All field are required!' })
//       return
//     }
//         const user = await User.findOne({email: email})
//     if (!user) {
//       res.status(404).json({ success: false, message: 'User not found!' })
//     }
//     if (!user.password_reset_token) {
//       res.status(404).json({ success: false, message: 'Password reset token is invalid !' })
//     }
//     const verify = jwt.decode( user.password_reset_token, process.env.JWT_ACCESS_SECRET)
//     if (verify.otp !== otp) {
//       res.status(404).json({ success: false, message: 'Invalid OTP!' })
//     }

//     const hash = await bcrypt.hash(password, 10)
//     await User.findByIdAndUpdate(user._id, { password: hash, password_reset_token: null })
//     res.json({ success: true, message: 'Password reset successfully' })
//   } catch (error) {
//     res
//       .statusA(500)
//       .json({ success: false, message: 'Failed to reset password!' })
//   }
// }

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body

    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'All fields are required' })
    }

    const user = await User.findOne({ email })
    if (!user || !user.password_reset_token) {
      return res
        .status(404)
        .json({ success: false, message: 'Invalid token or user not found' })
    }

    const decoded = jwt.decode(
      user.password_reset_token,
      process.env.JWT_ACCESS_SECRET
    )
    if (!decoded || decoded.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    // const hashedPassword = await bcrypt.hash(password, 10)
    user.password = password
    user.password_reset_token = null
    await user.save()
    return res.json({ success: true, message: 'Password reset successfully' })
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to reset password' })
  }
}


// change password
const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body

    if (!newPassword || newPassword.trim() === '') {
      return res
        .status(400)
        .json({ success: false, message: 'New password cannot be empty!' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'User not found!' })
    }

    const match = await bcrypt.compare(oldPassword, user.password)
    if (!match) {
      return res.status(400).json({
        success: false,
        message: 'Old password is incorrect!',
      })
    }

    // const hash = await bcrypt.hash(newPassword, 10)
    user.password = newPassword
    await user.save()

    res
      .status(200)
      .json({ success: true, message: 'Password has been changed' })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to change password' })
  }
}
const logout = async (req, res) => {
  const user = req.user?._id;
  const user1 = await User.findByIdAndUpdate(
    user,
    { refreshToken: "" },
    { new: true }
  );
  res.status(200).send({
    success: true,
    message: "Logged out successfully",
  })
}


module.exports = {
  registration,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  logout,
  verifyOtp,
  changePassword,
  verifyEmail
}
