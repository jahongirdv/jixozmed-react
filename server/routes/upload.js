const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uploadController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/photo', authMiddleware, ctrl.upload.single('photo'), ctrl.uploadPhoto);
router.delete('/photo/:filename', authMiddleware, ctrl.deletePhoto);

module.exports = router;
