const express = require('express');
const router = express.Router();
const resetPasswordController = require('../controllers/resetPasswordController');


router.route("/request")  
    .post(resetPasswordController.requestPasswordReset);

router.route("/reset")  
    .post(resetPasswordController.resetPassword);

module.exports = router;