/**
 * Created by rafaelpossas on 28/09/15.
 */
/**
 * Created by rafaelpossas on 5/09/15.
 */
var express = require('express');
var router = express.Router();
var tags = require('../controllers/tags')


router.get('/',tags.getAllTags);

module.exports = router;
