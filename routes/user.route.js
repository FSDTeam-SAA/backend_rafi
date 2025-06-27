const express = require('express');
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/multer.middleware');
const { updateUser, GetAllReffer, singleUser, support, getNotification } = require('../controllers/user.controller');

const router = express.Router();

router.get('/get-refer',GetAllReffer)
router.post('/update-user',upload.single('imageLink') ,updateUser);
router.get("/get-user/:id",singleUser)
router.post("/support",support)
router.get("/notification", protect,getNotification)



module.exports = router;