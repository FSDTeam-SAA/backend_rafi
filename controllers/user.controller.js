import User from "../models/user.model"

export const updateUser = async (req, res) => {
  try {
    const {id, userName,phoneNumber, address} = req.body

    if (!userName || !email) {
      return res
        .status(400)
        .json(apiResponse(400, 'username and email are required'))
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
    const user = await User.findByIdAndUpdate(id, { $set: { userName, phoneNumber, address,profilePhoto: imageLink } }, { new: true }) 


    return res
      .status(201)
      .json(apiResponse(201, 'user update successfull', user))
  } catch (error) {
    return res.json(apiResponse(500, 'server error', error.message))
  }
}