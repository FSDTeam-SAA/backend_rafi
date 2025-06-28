const User = require("../models/user.model");
const { uploadOnCloudinary } = require("../utils/cloudnary");

exports.createInfluences = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, address } = req.body;
        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.status(400).json({ message: "User already exists" });
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
        const user = await User.create({
            fullName,
            userName: fullName,
            email,
            password,
            phoneNumber,
            address,
            profilePhoto: imageLink,
            role: 'influencer',
        });

        res.status(201).json({
            status: true,
            message: "Influencer created successfully",
            data: user
        })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: false, message: "Failed to create influencer " });

    }

}


exports.getAllInfluencers = async (req, res) => {
    try {
        const { page = '1', limit = '10', search = '' } = req.query;

        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        // Build search filter
        const searchFilter = search
            ? {
                role: 'influencer',
                $or: [
                    { email: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } },
                ],
            }
            : { role: 'influencer', };
        const total = await User.countDocuments(searchFilter);

        const users = await User.find(searchFilter).select("-password")
        res.status(200).json({
            status: true,
            message: "Influencers fetched successfully",
            data: users,
            meta: {
                total: total,
                limit: limitNumber,
                page: pageNumber,
                pages: Math.ceil(total / limitNumber),
            }
        })

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ status: false, message: "Failed to get all influencers " });

    }
}

exports.deleteInfluencer = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                status: false, message: "Influencer not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "Influencer deleted successfully",
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: "Failed to delete influencer " });
    }
}