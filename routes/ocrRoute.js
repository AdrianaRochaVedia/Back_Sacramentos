const { Router } = require('express');
const multer = require('multer');

const { procesarOCR } = require('../controllers/ocrController');

const router = Router();
const upload = multer({ dest: 'uploads/'});

router.post(
  '/ocr-sacramento',
  upload.single('documento'),
  procesarOCR
);

module.exports = router;