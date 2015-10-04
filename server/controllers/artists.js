var ArtistController = function () {
    var Artist = require('../models/Artist');
    var User = require('../models/User');

    var getArtistInformation = function (req, res, next) {
        var id = req.params.id;
        var promise = Artist.schema.methods.getArtistInformationMongoDB(id);
        promise
            .then(function (data) {
                res.status(200).send(data);
            }, function (err) {
                next(err);
            });
    }
    var getAllArtists = function (req, res, next) {
        var promise = Artist.schema.methods.getAllArtists();
        promise
            .then(function (result) {
                var formattedArtists = [];
                result.body.data.forEach(function (artist) {
                    formattedArtists.push(
                        {
                            id: artist[0],
                            name: artist[1],
                            img: artist[2],
                            url: artist[3]
                        }
                    )
                });
                res.status(200).send(formattedArtists);
            })
    }
    var listenArtist = function (req, res, next) {
        var id = req.params.id;
        var userid = req.body.user;
        var user;
        var artist;
        var promise = Artist.model.findOne({_id: id}).exec();
        promise
            .then(function (art) {
                artist = art
                return User.model.findOne({_id: userid}).exec();
            })
            .then(function(user){
                return Artist.schema.methods.listen(user, artist);
            })
            .then(function (data) {
                res.status(200).send(data);
            }, function (err) {
                next(err);
            });
    }
    var tagArtist = function (req, res, next) {
        var id = req.params.id;
        var user = req.body.user;
        var tag = req.body.tag;
        var promise = Artist.model.findOne({_id: id}).exec();
        promise
            .then(function (art) {
                return Artist.schema.methods.addTag({_id: user}, art, {_id: tag});
            })
            .then(function (data) {
                res.status(200).send(data);
            }, function (err) {
                res.status(501).send(err);
            });
    }
    var recommendArtists = function (req, res, next) {
        try {
            var type = req.query.type;
            var userid = req.query.userid;
            if (!type || !userid) {
                res.status(400).send({message: "Could not locate the value of the User Id and the type of recommendation within the request"});
            }
            var promise;
            if (type === 'listeningCount') {
                promise = Artist.schema.methods.recommendTopFiveArtistsByFriendsListeningCountNeo4j(userid);
            } else if (type === 'friendsCount') {
                promise = Artist.schema.methods.recommendTopFiveArtistsByFriendsCountNeo4j(userid);
            } else if (type === 'tag') {
                promise = Artist.schema.methods.recommendByTagPolyglot(userid);
            }
            promise
                .then(function (data) {
                    res.status(200).send(data);
                }, function (err) {
                    res.status(501).send({message: err});
                });
        } catch (e) {
            next(e);
        }

    }
    var rankArtists = function (req, res, next) {
        try {
            var type = req.query.type;
            var promise;
            if (type === "listeningCount") {
                promise = Artist.schema.methods.rankTopFiveArtistsByListeningCountMongoDB();
            } else if (type === "userCount") {
                promise = Artist.schema.methods.rankTopFiveArtistsByUserCountMongoDB();
            } else if (type === "givenTag") {
                var tagid = req.query.tag;
                promise = Artist.schema.methods.rankTopFiveArtistsByGivenTagPolyglot(Number(tagid));
            }
            promise
                .then(function (result) {
                    res.status(200).send(result);
                }, function (err) {
                    res.status(500).send({message: err});
                })
        } catch (e) {
            next(e);
        }
    }
    return {
        getArtistInformation: getArtistInformation,
        listenArtist: listenArtist,
        tagArtist: tagArtist,
        recommendArtists: recommendArtists,
        rankArtists: rankArtists,
        getAllArtists: getAllArtists
    }
}();

module.exports = ArtistController;
