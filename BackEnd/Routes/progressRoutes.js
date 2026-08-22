const express = require('express') ;

const router = express.Router() ;

const progressController = require('../Controller/progressController') ;

const auth = require('../Middleware/authMiddleware') ;

router.get('/dashboard', auth, progressController.getDashBoard)

module.exports = router ;