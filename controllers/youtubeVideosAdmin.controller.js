const youtubeVideos = require("../models/youtubeVideosAdmin.model");

const createYoutubeVideo = async (req, res) => {
    try {
        const {videoTitle, videoLink} = req.body;
        if(!videoTitle || !videoLink){
            return res.status(400).json({
                status : false,
                message : "enter videoTitle and videoLink!"
            });
        }
        const youtubeVideo = await youtubeVideos.create({
            videoTitle, 
            videoLink
        })

        return res.status(201).json({
            status : true,
            message : "youtube video created successfully!",
            data : youtubeVideo,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        }); 
    }
}

const updatePublishStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { publish } = req.body;

        if (publish !== true && publish !== false) {
            return res.status(400).json({
                status: false,
                message: "Please provide a publish status.",
            });
        }

        const youtubeVideo = await youtubeVideos.findByIdAndUpdate(
            id,
            { publish },
            { new: true }
        );

        if (!youtubeVideo) {
            return res.status(404).json({
                status: false,
                message: "Youtube video not found.",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Youtube video publish status updated successfully.",
            data: youtubeVideo,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
}; 

const updateYoutubeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { videoTitle, videoLink } = req.body;

        if (!videoTitle && !videoLink) {
            return res.status(400).json({
                status: false,
                message: "Please provide at least one field to update: videoTitle or videoLink.",
            });
        }

        const updateFields = {};
        if (videoTitle) updateFields.videoTitle = videoTitle;
        if (videoLink) updateFields.videoLink = videoLink;

        const youtubeVideo = await youtubeVideos.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!youtubeVideo) {
            return res.status(404).json({
                status: false,
                message: "Youtube video not found.",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Youtube video updated successfully.",
            data: youtubeVideo,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
};

const getAllYoutubeVideos = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await youtubeVideos.countDocuments();
        const youtubeVideosList = await youtubeVideos.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            status: true,
            message: "Youtube videos retrieved successfully.",
            data: youtubeVideosList,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
};

const getSpecificYoutubeVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const youtubeVideo = await youtubeVideos.findById(id);

        if (!youtubeVideo) {
            return res.status(404).json({
                status: false,
                message: "Youtube video not found.",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Youtube video retrieved successfully.",
            data: youtubeVideo,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
};

const deleteYoutubeVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const youtubeVideo = await youtubeVideos.findByIdAndDelete(id);

        if (!youtubeVideo) {
            return res.status(404).json({
                status: false,
                message: "Youtube video not found.",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Youtube video deleted successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
};

module.exports = {
    createYoutubeVideo,
    updatePublishStatus,
    updateYoutubeVideo,
    getAllYoutubeVideos,
    getSpecificYoutubeVideo,
    deleteYoutubeVideo
}