const express = require('express');
const { createNews, getAllNews, getSingleNews, updateNews, deleteNews } = require("../controllers/news.controller");
const router = express.Router();

router.post('/create-news', createNews);
router.get('/all-news', getAllNews);    
router.get('/:id', getSingleNews);
router.patch('/:id', updateNews);
router.delete('/:id', deleteNews);

module.exports = router;