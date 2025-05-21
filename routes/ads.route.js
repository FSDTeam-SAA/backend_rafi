const express = require('express');
const { createAd, getAllAds, getSingleAd, updateAd, deleteAd } = require("../controllers/ads.controller");

const router = express.Router();

router.post('/create-ads', createAd);
router.get('/all-ads', getAllAds);
router.get('/:id', getSingleAd);
router.patch('/:id', updateAd);
router.delete('/:id', deleteAd);

module.exports = router;