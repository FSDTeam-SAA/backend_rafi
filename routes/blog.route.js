const express = require('express');
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const { createblog, getAllblog, getSingleblog, updateblog, deleteblog } = require('../controllers/blog.controller');

const router = express.Router();

router.post('/create-blog',protect,isAdmin,upload.single('imageLink') ,createblog);
router.get('/all-blog',protect, getAllblog);
router.get('/:id',protect, getSingleblog);
router.patch('/:id',protect,isAdmin,upload.single('imageLink'), updateblog);
router.delete('/:id',protect,isAdmin, deleteblog);

module.exports = router;