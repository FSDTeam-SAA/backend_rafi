const express = require('express');
const multer = require('multer');
const { uploadOlive, uploadCSV, getAllOlive, deleteOlive } = require('../controllers/olive.controller');
const { getDashboardStats } = require('../controllers/dashboard.controller');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Create from single ticker data
router.post('/olive',uploadOlive)
router.post('/olive/upload', upload.single('file'),uploadCSV)
router.get('/olive', getAllOlive)
router.delete('/olive/:id', deleteOlive)

router.get("/admin/dashboard",getDashboardStats)


module.exports = router;