global.config = require('../config/config')["test"];
var mng = require('../config/mongoose.js');

var chai = require('chai');
var expect = chai.expect;
var superagent = require('superagent');
var Artist = require("../models/Artist");
var User = require("../models/User");

describe("Artist",function(){

    before(function (done) {
        this.timeout(10000);
        mng(global.config.db,true)
            .then(function(){
                done();
            })
    });

    describe("The code",function(){
        it("should transform an array into a string",function(){
            var artists = [1,2,3,4];
            var artistsString = Artist.schema.methods.getArtistsStringByArray(artists);
            expect(artistsString).to.equal("'1','2','3','4'");
        });
    });
    describe("The  database",function(){

        it("should return an artist by id",function(done){
            var promise = Artist.schema.methods.getArtistInformation(1);
            promise
                .then(function(data){
                    try{
                        expect(data._id).to.equal(1);
                        done();
                    }catch(e){
                        done(e);
                    }
                },function(err){
                    done(err);
                })

        });
        it("should let the user listen to an specific artist",function(done){
            var promise = User.model.findOne({_id:1}).exec();
            promise
                .then(function(res){
                     return Artist.schema.methods.listen(res,{_id: 10});
                }).then(function(res){
                    try{
                        expect(res.artists[0].count).to.equal(13884);
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(err){
                    done(err);
                });
        });
        it("should make 5 recommendations of artists that may interest a user ordered by the sum of friends listening counts (MongoDB)",function(done){
            var promise = Artist.schema.methods.recommendTopFiveArtistsByFriendsListeningCountMongoDB(1);
            promise
                .then(function(data){
                    try{
                        expect(data.length).to.equal(5);
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(error){
                    done(err);
                });

        });
        it("should make 5 recommendations of artists that may interest a user ordered by the sum of friends listening counts (Neo4j)",function(done){
            var promise = Artist.schema.methods.recommendTopFiveArtistsByFriendsListeningCountNeo4j(1);
            promise
                .then(function(data){
                    expect(data.length).to.equal(5)
                    done();
                },function(error){
                    done(error);
                });

        });
        it("should make 5 recommendations of artists that may interest a user ordered by the sum of friends counts (MongoDB)",function(done){
            var promise = Artist.schema.methods.recommendTopFiveArtistsByFriendsCountMongoDB(1);
            promise
                .then(function(data){
                    try{
                        expect(data.length).to.equal(3);
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(error){
                    done(error);
                });

        });
        it("should make 5 recommendations of artists that may interest a user ordered by the sum of friends counts (Neo4j)",function(done){
            var promise = Artist.schema.methods.recommendTopFiveArtistsByFriendsCountNeo4j(1);
            promise
                .then(function(data){
                    try{
                        expect(data.length).to.equal(3);
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(error){
                    done(error);
                });

        });
        it("should make 5 recommendations of artists by using a random tag (MongoDB)",function(done){
            var promise = Artist.schema.methods.recommendByTagMongoDB(1);
            promise
                .then(function(data){
                    done();
                },function(err){
                    done(err);
                });

        });
        it("should make 5 recommendations of artists by using a random tag (Neo4j)",function(done){
            var promise = Artist.schema.methods.recommendByTagNeo4j(1);
            promise
                .then(function(data){
                    done();
                },function(err){
                    done(err);
                });

        });
        it("should make 5 recommendations of artists by using a random tag (Polyglot)",function(done){
            var promise = Artist.schema.methods.recommendByTagPolyglot(1);
            promise
                .then(function(data){
                    done();
                },function(err){
                    done(err);
                });

        });
        it("should rank top 5 artists by listening count (MongoDB)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByListeningCountMongoDB();
            promise
                .then(function(data){
                    try{
                        expect(data).to.not.be.undefined;
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(err){
                    done(err);
                });
        });
        it("should rank top 5 artists by listening count (Neo4j)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByListeningCountNeo4j();
            promise
                .then(function(data){
                    try{
                        expect(data).to.not.be.undefined;
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(err){
                    done(err);
                });
        });
        it("should rank top 5 artists by user count (MongoDB)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByUserCountMongoDB();
            promise
                .then(function(data){
                    try{
                        expect(data).to.not.be.undefined;
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(err){
                    done(err);
                });
        });
        it("should rank top 5 artists by user count (Neo4j)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByUserCountNeo4j();
            promise
                .then(function(data){
                    try{
                        expect(data).to.not.be.undefined;
                        done();
                    }catch (e){
                        done(e);
                    }

                },function(err){
                    done(err);
                });
        });
        it("should rank top 5 artists by a given tag and listening count (MongoDB)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByGivenTagMongoDB(9)
                promise.then(function(data){
                    try{
                        expect(data).to.not.be.undefined;
                        done();
                    }catch (e){
                        done(e)
                    }

                },function(err){
                    done(err);
                });
        });
        it("should rank top 5 artists by a given tag and listening count (Neo4j)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByGivenTagNeo4j(9)
            promise.then(function(data){
                try{
                    expect(data).to.not.be.undefined;
                    done();
                }catch (e){
                    done(e)
                }

            },function(err){
                done(err);
            });
        });
        it("should rank top 5 artists by a given tag and listening count (Polyglot)",function(done){
            var promise = Artist.schema.methods.rankTopFiveArtistsByGivenTagPolyglot(2)
            promise.then(function(data){
                try{
                    expect(data).to.not.be.undefined;
                    done();
                }catch (e){
                    done(e)
                }

            },function(err){
                done(err);
            });
        });
    });

    describe("The application",function(){

        it("should allow a user to query and browse the basic information about any artist",function(done){
            superagent
                .get("http://localhost:3000/artists/5")
                .end(function(err,res){
                    try{
                        expect(err).to.be.null;
                        expect(res.status).to.equal(200);
                        expect(res.body.id).to.equal("5");
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it("should allow a user to listen to musics of any artist, the system keeps track of the listening count per user per artist",function(done){
            superagent
                .post("http://localhost:3000/artists/1/listen")
                .send({user:1})
                .end(function(err,res){
                    try{
                        expect(err).to.be.null;
                        expect(res.status).to.equal(200);
                        expect(res.body._id).to.equal(1);
                        done();
                    } catch (e){
                        done(e);
                    }


                })
        });
    });
});
