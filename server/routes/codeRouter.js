const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');
const {isAuthenticated} = require('../middleware/protector');


router.route("/")  
    .post(isAuthenticated, codeController.runCode);

module.exports = router;