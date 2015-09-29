/**
 * Created by rafaelpossas on 28/09/15.
 */
/**
 * Created by rafaelpossas on 5/09/15.
 */
var express = require('express');
var router = express.Router();
var taps = require('../controllers/tags')
/* GET users listing. */

router.get('/',taps.getTaps);

module.exports = router;
