const express = require('express');
const router = express.Router(); 
const authController = require('../controllers/authController');
const {isAuthenticated} = require('../middleware/protector');

router.route("/")  
    .post(authController.validateUser)
    .get(authController.sessionExists)
    .delete(isAuthenticated, authController.deleteSession);


module.exports = router;