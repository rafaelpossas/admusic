/**
 * Created by rafaelpossas on 26/09/15.
 */
/**
 * Created by rafaelpossas on 4/16/15.
 */
/**
 * Created by rafaelpossas on 3/25/15.
 */
var express = require('express');
var router = express.Router();
var artists = require('../controllers/artists');
router.get('/',artists.getAllArtists);
router.get('/recommend',artists.recommendArtists);
router.get('/rank',artists.rankArtists);
router.get('/:id',artists.getArtistInformation);
router.post('/:id/listen',artists.listenArtist);
router.post('/:id/tag',artists.tagArtist);


module.exports = router;
