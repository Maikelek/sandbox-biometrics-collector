const express = require('express');
const router = express.Router(); 
const problemController = require('../controllers/problemController');

router.route("/:userId")  
    .get(problemController.getUserProblems)

router.route("/info/:problemId")  
    .get(problemController.getProblemWithExamples)


module.exports = router;