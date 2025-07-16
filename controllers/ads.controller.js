const Ads = require("../models/adsAdmin.model");
const User = require("../models/user.model");
const { uploadOnCloudinary } = require("../utils/cloudnary");
const cloudinary = require("cloudinary").v2;

exports.createAd = async (req, res) => {
    try {
        const { adsTitle, adsContent, url} = req.body;

        let imageLink
        if (req.file) {
            try {
                const image = await uploadOnCloudinary(req.file.buffer, 'ads');
                imageLink = image.secure_url;
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: 'Failed to upload image',
                });
            }
        }
        // Create a new ad item       
        const ad = new Ads({
            adsTitle,
            adsContent,
            imageLink,
            url
            // author,
        });
        await ad.save();
        return res.status(201).json({
            status: true,
            message: 'Ad created successfully',
            data: ad,
        });
    }
    catch (error) {
        console.error('Error creating ad:', error);
        return res.status(500).json({
            status: false,
            message: 'Error creating ad',
            error: error.message,
        });
    }
};

//_______________________________________

//getting all ads

exports.getAllAds = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const filter = {
        $or: [
            { adsTitle: { $regex: search, $options: 'i' } },
        ]
    }
    const ads = await Ads.find(filter).sort({ createdAt: -1 }).populate('author', 'name email').skip(skip).limit(limit);
    const totalAds = await Ads.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / limit);
    if (ads.length === 0) {
        return res.status(404).json({
            status: false,
            message: 'No ads found',
        });
    }

    res.status(200).json({
        status: true,
        message: 'Ads fetched successfully',
        data: ads,
        meta: {
            total: totalAds,
            page: page,
            limit: limit,
            totalPages: totalPages,
        }
    });
};

//_______________________________________

//getting single ad

exports.getSingleAd = async (req, res) => {
    try {
        const adId = req.params.id;
        const ad = await Ads.findById(adId).populate('author', 'name email');
        if (!ad) {
            return res.status(404).json({
                status: false,
                message: 'Ad not found',
            });
        }
        res.status(200).json({
            status: true,
            message: 'Ad fetched successfully',
            data: ad,
        });
    }
    catch (error) {
        console.error('Error fetching ad:', error);
        return res.status(500).json({
            status: false,
            message: 'Error fetching ad',
            error: error.message,
        });
    }
};


//_______________________________________

//updating ad

exports.updateAd = async (req, res) => {
    try {
        const adId = req.params.id;
        const { adsTitle, adsContent ,url} = req.body;
        // const author = req.user._id; // Assuming you have user authentication middleware
        const existingAd = await Ads.findById(adId);
        if (!existingAd) {
            return res.status(404).json({
                status: false,
                message: 'Ad not found',
            });
        }
        if (req.file) {
            try {
                await cloudinary.uploader.destroy(existingAd.imageLink)
                const image = await uploadOnCloudinary(req.file.buffer, 'ads');
                existingAd.imageLink = image.secure_url;
            } catch (error) {
                return res.status(400).json({
                    status: false,
                    message: 'Failed to upload image',
                });
            }
        }

        // Update the ad item       
        existingAd.adsTitle = adsTitle;
        existingAd.adsContent = adsContent;
        existingAd.url = url;
        // existingAd.author = author;

        await existingAd.save();
        return res.status(200).json({
            status: true,
            message: 'Ad updated successfully',
            data: existingAd,
        });
    }
    catch (error) {
        console.error('Error updating ad:', error);
        return res.status(500).json({
            status: false,
            message: 'Error updating ad',
            error: error.message,
        });
    }
}

//_______________________________________

//deleting ad

exports.deleteAd = async (req, res) => {
    try {
        const adId = req.params.id;
        const ad = await Ads.findByIdAndDelete(adId);
        if (!ad) {
            return res.status(404).json({
                status: false,
                message: 'Ad not found',
                data: "",
            });
        }
        res.status(200).json({
            status: true,
            message: 'Ad deleted successfully',
            data: "",
        });
    }
    catch (error) {
        console.error('Error deleting ad:', error);
        return res.status(500).json({
            status: false,
            message: 'Error deleting ad',
            error: error.message,
        });
    }
}

exports.updatePublishStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { publish } = req.body;

        if (publish !== true && publish !== false) {
            return res.status(400).json({
                status: false,
                message: "Please provide a publish status.",
            });
        }

        const youtubeVideo = await Ads.findByIdAndUpdate(
            id,
            { publish },
            { new: true }
        );

        if (!youtubeVideo) {
            return res.status(404).json({
                status: false,
                message: "Ads not found.",
            });
        }

        return res.status(200).json({
            status: true,
            message: "ads publish status updated successfully.",
            data: youtubeVideo,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
}; 
