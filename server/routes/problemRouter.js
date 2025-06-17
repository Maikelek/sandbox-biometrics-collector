const express = require('express');
const router = express.Router(); 
const problemController = require('../controllers/problemController');

router.route("/:userId")  
    .get(problemController.getUserProblems)


module.exports = router;