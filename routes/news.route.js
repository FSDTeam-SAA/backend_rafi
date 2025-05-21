const express = require('express');
const { createNews, getAllNews, getSingleNews, updateNews, deleteNews } = require("../controllers/news.controller");
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const router = express.Router();

router.post('/create-news',protect,isAdmin, createNews);
router.get('/all-news',protect,isAdmin, getAllNews);    
router.get('/:id',protect,isAdmin, getSingleNews);
router.patch('/:id',protect,isAdmin, updateNews);
router.delete('/:id',protect,isAdmin, deleteNews);

module.exports = router;