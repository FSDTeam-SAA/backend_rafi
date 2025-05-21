const Ads = require("../models/adsAdmin.model");
const User = require("../models/user.model");

exports.createAd = async (req, res) => {
    try {
        const { adsTitle, adsContent, imageLink, tickers } = req.body;
        // const author = req.user._id; // Assuming you have user authentication middleware
        const existingAd = await Ads.findOne({ adsTitle });
        if (existingAd) {
            return res.status(400).json({
                status: false,
                message: 'Ad with this title already exists',
            });
        }
        // Validate the request body
        if (!adsTitle || !adsContent || !imageLink || !tickers) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required',
            });
        }
        // Create a new ad item       
        const ad = new Ads({
            adsTitle,
            adsContent,
            imageLink,
            tickers,
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
            { adsContent: { $regex: search, $options: 'i' } },
            { tickers: { $regex: search, $options: 'i' } }
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
        totalAds,
        totalPages,
        currentPage: page,
    });
};

//_______________________________________

//getting single ad

exports.getSingleAd = async (req, res) => {
   try{
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
        const { adsTitle, adsContent, imageLink, tickers } = req.body;
        // const author = req.user._id; // Assuming you have user authentication middleware
        const existingAd = await Ads.findById(adId);
        if (!existingAd) {
            return res.status(404).json({
                status: false,
                message: 'Ad not found',
            });
        }
        // Validate the request body
        if (!adsTitle || !adsContent || !imageLink || !tickers) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required',
            });
        }
        // Update the ad item       
        existingAd.adsTitle = adsTitle;
        existingAd.adsContent = adsContent;
        existingAd.imageLink = imageLink;
        existingAd.tickers = tickers;
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
    try{
        const adId = req.params.id;
        const ad = await Ads.findByIdAndDelete(adId);
        if (!ad) {
            return res.status(404).json({
                status: false,
                message: 'Ad not found',
                data:[],
            });
        }
        res.status(200).json({
            status: true,
            message: 'Ad deleted successfully',
            data: ad,
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