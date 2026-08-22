const multer = require('multer');

const storage = multer.memoryStorage(); // 👈 Disk ki jagah memory storage

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