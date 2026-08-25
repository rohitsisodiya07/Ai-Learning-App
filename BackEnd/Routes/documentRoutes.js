const express = require('express');
const router = express.Router();

const documentController = require('../Controller/documentController');
const upload = require('../Middleware/multer');
const auth = require('../Middleware/authMiddleware');

router.post('/upload', auth, upload.single('file'), documentController.uploadDocument);

router.get('/', auth, documentController.getDocuments);

router.get('/:id', auth, documentController.getSingleDocument);

router.delete('/:id', auth, documentController.deleteDocument);

router.patch(
    "/:id",
    auth,
    documentController.updateDocument
);

module.exports = router;