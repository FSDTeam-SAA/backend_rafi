const express = require('express');
const { createNews, getAllNews, getSingleNews, updateNews, deleteNews, merketNewsFromAPi, deepReSearch, uploadCSV, getMultipleCompanyNews } = require("../controllers/news.controller");
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const router = express.Router();
router.get('/deep-research',deepReSearch)
router.get('/market-news',merketNewsFromAPi)
router.post('/news/upload', upload.single('file'),uploadCSV)
router.get('/all-news', getAllNews);    
router.post('/create-news',protect,isAdmin,upload.single('imageLink'), createNews);
router.post ("/get-protfolio-news",getMultipleCompanyNews)
router.get('/:id', getSingleNews);
router.patch('/:id',protect,isAdmin,upload.single('imageLink'), updateNews);
router.delete('/:id',protect,isAdmin, deleteNews);





module.exports = router;