const express = require('express');
const router = express.Router(); 
const adminController = require('../controllers/adminController');
const {isAdmin} = require('../middleware/protector');

router.route("/users")  
    .get(isAdmin, adminController.getAllUsers)
    .delete(isAdmin, adminController.deleteUser);

router.route("/user/:id")  
    .get(isAdmin, adminController.getUserById)
    .put(isAdmin, adminController.updateUser);

router.route("/problems")  
    .get(isAdmin, adminController.getAllProblems)
    .delete(isAdmin, adminController.deleteProblem);

router.route("/problem/:id")
    .get(isAdmin, adminController.getProblemById)
    .put(isAdmin, adminController.updateProblem);


module.exports = router;