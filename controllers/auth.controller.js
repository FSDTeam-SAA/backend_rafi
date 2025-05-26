const apiResponse = require('quick-response')
const User = require('../models/user.model')
const { generateToken } = require('../utils/generateToken')
const { createToken } = require('../utils/authToken')
const jwt = require('jsonwebtoken')
const { sendMail } = require('../config/mailer')
const bcrypt = require('bcrypt')
// register user
const registration = async (req, res) => {
  try {
    const { userName, email, password, confirmPassword } = req.body

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
      return res.status(400).json(apiResponse(400, 'user already exists'))
    }

    const user = await User.create({ userName, email, password })

    return res
      .status(201)
      .json(apiResponse(201, 'user registration successfull', user))
  } catch (error) {
    return res.json(apiResponse(500, 'server error', error.message))
  }
}

// login user
const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const userFound = await User.findOne({ email })
    if (!userFound) {
      return res.status(404).json(apiResponse(404, 'user not found'))
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

    return res.status(200).json(
      apiResponse(200, 'login succcessful', {
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

// forget password
const forgotPassword = async (req, res) => {
  console.log('first')
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      res.status(400).json({ success: false, message: 'User not found!' })
      return
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '50h',
    })
    const link = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`

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
            <p>You recently requested to reset your password. Click the button below to reset it:</p>
            <a href="${link}" class="btn">Reset Password</a>
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
      .json({ success: true, message: 'Password reset link has send' })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fail to send password reset link',
    })
  }
}

// reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      res
        .statusA(404)
        .json({ success: false, message: 'All field are required!' })
      return
    }

    let decode
    try {
      decode = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    } catch (error) {
      if (error.name == 'TokenExpiredError') {
        res.status(400).json({ success: false, message: 'Token has expired' })
        return
      }
      res.status(400).json({ success: false, message: 'Invalid token ' })
      return
    }

    const hash = await bcrypt.hash(password, 10)
    await User.findByIdAndUpdate(decode.id, { password: hash })
    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    res
      .statusA(500)
      .json({ success: false, message: 'Failed to reset password!' })
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

    const hash = await bcrypt.hash(newPassword, 10)
    user.password = hash

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


module.exports = {
  registration,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
}
