const expreess = require('express');
const { createYoutubeVideo, updateYoutubeVideo, getAllYoutubeVideos, getSpecificYoutubeVideo, deleteYoutubeVideo, updatePublishStatus } = require('../controllers/youtubeVideosAdmin.controller');
const router = expreess.Router();

router.post("/create", createYoutubeVideo),
router.patch ("/update-video/:id",updateYoutubeVideo ),
router.get( "/get-all-videos", getAllYoutubeVideos ),
router.get( "/get-video/:id", getSpecificYoutubeVideo ),
router.delete( "/delete-video/:id", deleteYoutubeVideo );
router.patch( "/change-status/:id", updatePublishStatus);

module.exports = router;