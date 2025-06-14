const User = require("../models/user.model");


exports.updateUser = async (req, res) => {
  try {
    const { id, email, userName, phoneNumber, address } = req.body

    if (!userName || !email) {
      return res.status(400).send({
        succuss: false,
        message: "Please enter all fields",

      })
    }
    let imageLink
    if (req.file) {
      try {
        const image = await uploadOnCloudinary(req.file.buffer, 'users');
        imageLink = image.secure_url;
      } catch (error) {
        return res.status(400).json({
          status: false,
          message: 'Failed to upload image',
        });
      }
    }
    const user = await User.findByIdAndUpdate(id, { $set: { userName, phoneNumber, address, profilePhoto: imageLink } }, { new: true })


    return res
      .status(201).send({
        success: true,
        message: "User updated successfully",
        data: user
      })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message
    })
  }
}

exports.GetAllReffer = async (req, res) => {
  try {
    const user = await User.find().select('userName email refferCount')
    res.status(200).send({
      status: true,
      message: 'success',
      data: user
    })

  } catch (error) {
    res.status(500).send({
      status: false,
      message: 'server error',
      error: error.message
    })

  }
}

exports.singleUser = async (req, res) => {
  try {
    const id = req.params.id
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      })
    }
    res.status(200).send({
      status: true,
      message: 'success',
      data: user
    })
  } catch (error) {
    res.status(500).send({
      status: false,
      message: 'server error',
      error: error.message
    })
  }
}