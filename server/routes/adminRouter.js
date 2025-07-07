const express = require('express');
const router = express.Router(); 
const adminProblemController = require('../controllers/adminProblemController');
const adminUserController = require('../controllers/adminUserController');
const {isAdmin} = require('../middleware/protector');

router.route("/users")  
    .get(isAdmin, adminUserController.getAllUsers)
    .post(isAdmin, adminUserController.addUser)
    .delete(isAdmin, adminUserController.deleteUser);

router.route("/user/:id")  
    .get(isAdmin, adminUserController.getUserById)
    .put(isAdmin, adminUserController.updateUser);

router.route("/problems")  
    .get(isAdmin, adminProblemController.getAllProblems)
    .post(isAdmin, adminProblemController.addProblem)
    .delete(isAdmin, adminProblemController.deleteProblem);

router.route("/tags")  
    .get(isAdmin, adminProblemController.getAllTags)

router.route("/problem/:id")
    .get(isAdmin, adminProblemController.getProblemById)
    .put(isAdmin, adminProblemController.updateProblem);

router.route("/problem/testcase/:id")
    .get(isAdmin, adminProblemController.getTestcaseByProblemId)
    .put(isAdmin, adminProblemController.updateTestcaseByProblemId);



module.exports = router;