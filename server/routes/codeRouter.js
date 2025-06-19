const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');


router.route("/")  
    .post(codeController.runCode);

module.exports = router;