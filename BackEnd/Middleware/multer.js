const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/documents');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        console.log('Upload directory:', uploadDir);
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {

        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(
            null,
            `${uniqueSuffix}-${file.originalname}`
        );
    }
});

const fileFilter = (req, file, cb) => {

    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed!'), false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;