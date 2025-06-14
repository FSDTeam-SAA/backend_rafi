const expreess = require('express');
const { createInfluences, getAllInfluencers, deleteInfluencer } = require('../controllers/influencers.controller');
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const router = expreess.Router();

router.post("/create", protect,isAdmin,upload.single('imageLink'),createInfluences),
router.delete("/delete-influencer/:id",protect,isAdmin,deleteInfluencer)
router.get( "/get-all-influencer", getAllInfluencers ),
// router.get( "/get-video/:id", getSpecificYoutubeVideo ),

module.exports = router;