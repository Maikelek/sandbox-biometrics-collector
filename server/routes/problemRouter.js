const express = require('express');
const router = express.Router(); 
const problemController = require('../controllers/problemController');
const {isAuthenticated} = require('../middleware/protector');

router.route("/:userId")  
    .get(isAuthenticated, problemController.getUserProblems)

router.route("/info/:problemId")  
    .get(isAuthenticated, problemController.getProblemWithExamples)


module.exports = router;