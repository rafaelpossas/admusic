var ArtistController = function () {
    var Artist = require('../models/Artist');
    var User = require('../models/User');

    var getArtistMongoDB = function (req, res, next) {
        var id = req.params.id;
        var promise = Artist.schema.methods.getArtistMDB(id);
        promise
            .then(function (data) {
                res.status(200).send(data);
            }, function (err) {
                next(err);
            });
    }
    var getArtistNeo4j = function (req, res, next) {
        var id = req.params.id;
        var promise = Artist.schema.methods.getArtistN4J(id);
        promise
            .then(function (data) {
                res.status(200).send(data.body.results[0].data[0].row[0]);
            }, function (err) {
                next(err);
            });
    }
    var listenArtist = function (req, res, next) {
        var id = req.params.id;
        var user = req.body.user;
        var promise = User.model.findOne({_id: user}).exec();
        promise
            .then(function (user) {
                return Artist.schema.methods.listen(user, {_id: id});
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
                return Artist.schema.methods.tag({_id:user},art,{_id:tag});
            })
            .then(function (data) {
                res.status(200).send(data);
            }, function (err) {
                next(err);
            });
    }
    var recommendArtists = function(req,res,next){
        try{
            var type = req.query.type;
            var userid = req.query.userid;
            if(!type || !userid){
                res.status(400).send({message:"Could not locate the value of the User Id and the type of recommendation within the request"});
            }
            var promise;
            if(type === 'listeningCount'){
                promise = Artist.schema.methods.recomendTopFiveArtistsByFriendsListeningCountPolyglot(userid);
            }else if(type === 'friendsCount'){
                promise = Artist.schema.methods.recomendTopFiveArtistsByFriendsCountPolyglot(userid);
            }
            promise
                .then(function(data){
                    res.status(200).send(data);
                },function(err){
                    res.status(501).send({message: err});
                });
        }catch (e){
            next(e);
        }

    }
    var rankArtists = function(req,res,next){
        try{
            var type = req.query.type;
            var promise;
            if(type === "listeningCount"){
                promise = Artist.schema.methods.rankTopFiveArtistsByListeningCountMongoDB();
            }else if(type ==="userCount"){
                promise = Artist.schema.methods.rankTopFiveArtistsByUserCountMongoDB();
            }
            promise
                .then(function(result){
                    res.status(200).send(result);
                },function(err){
                    res.status(500).send({message: err});
                })
        }catch (e){
            next(e);
        }
    }
    return {
        getArtistMongoDB: getArtistMongoDB,
        getArtistNeo4j: getArtistNeo4j,
        listenArtist: listenArtist,
        tagArtist: tagArtist,
        recommendArtists: recommendArtists,
        rankArtists: rankArtists
    }
}();

module.exports = ArtistController;
