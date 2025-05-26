const express = require('express');
const { createNews, getAllNews, getSingleNews, updateNews, deleteNews } = require("../controllers/news.controller");
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const router = express.Router();

router.get('/all-news',protect,isAdmin, getAllNews);    
router.post('/create-news',protect,isAdmin,upload.single('imageLink'), createNews);
router.get('/:id',protect,isAdmin, getSingleNews);
router.patch('/:id',protect,isAdmin,upload.single('imageLink'), updateNews);
router.delete('/:id',protect,isAdmin, deleteNews);

module.exports = router;