const express = require('express');
const { createAd, getAllAds, getSingleAd, updateAd, deleteAd, updatePublishStatus } = require("../controllers/ads.controller");
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');

const router = express.Router();

router.post('/create-ads',protect,isAdmin,upload.single('imageLink') ,createAd);
router.post('/update-ads-status/:id',protect,isAdmin ,updatePublishStatus);
router.get('/all-ads',protect,isAdmin, getAllAds);
router.get('/:id',protect,isAdmin, getSingleAd);
router.patch('/:id',protect,isAdmin,upload.single('imageLink'), updateAd);
router.delete('/:id',protect,isAdmin, deleteAd);


module.exports = router;