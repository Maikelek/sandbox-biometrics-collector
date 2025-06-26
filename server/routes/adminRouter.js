const express = require('express');
const router = express.Router(); 
const adminController = require('../controllers/adminController');

router.route("/users")  
    .get(adminController.getAllUsers)
    .delete(adminController.deleteUser);

router.route("/problems")  
    .get(adminController.getAllProblems)
    .delete(adminController.deleteProblem);


module.exports = router;