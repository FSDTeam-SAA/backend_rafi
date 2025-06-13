const express = require('express');
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const { updateUser, GetAllReffer } = require('../controllers/user.controller');

const router = express.Router();

router.post('/update-user',protect,upload.single('imageLink') ,updateUser);
router.get('/get-refer',protect,GetAllReffer)



module.exports = router;