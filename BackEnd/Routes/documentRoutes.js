const express = require('express');

const router = express.Router();

const documentController = require('../Controller/documentController');

const upload = require('../Middleware/multer')

const auth = require('../Middleware/authMiddleware')


//Upload Document
router.post('/upload', auth, upload.single('file'), documentController.uploadDocument);

//Get Document
router.get('/', auth, documentController.getDocuments);

router.get('/:id', auth, documentController.getSingleDocument);

//Delete Document
router.delete('/:id', auth, documentController.deleteDocument);

router.patch(
    "/:id",
    auth,
    documentController.updateDocument
);


module.exports = router;