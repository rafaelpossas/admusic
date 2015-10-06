/**
 * Created by rafaelpossas on 14/09/15.
 */
/**
 * Created by rafaelpossas on 3/09/15.
 */
global.config = require('../config/config')["test"];
var chai = require('chai');
var expect = chai.expect;
var superagent = require('superagent');
var Artist = require("../models/Artist");
var User = require("../models/User");
var enc = require('../utilities/encryption');
var iutil = require('../services/import');
var mng = require('../config/mongoose.js');

describe('User', function () {

    var totalDocuments;

    before(function (done) {
        totalDocuments = 0;
        this.timeout(10000);
        mng(global.config.db,false)
            .then(function(){
                done();
            })
    });
    describe("The database",function(){
        it("should let user query for recomendation based on friend's top artists",function(done){
            this.timeout(10000);
            var promise = Artist.schema.methods.rankTopFiveArtistsByUserCount();
            promise.then(function(col){
                done();
            })
        })
        it("should connect to a Neo4j Database using Base64 encoding",function(done){
            this.timeout(10000);
            superagent
                .get("http://localhost:7474/user/neo4j")
                .set('Authorization', ('Basic '+enc.base64Encoding("neo4j:1234")))
                .end(function(err,res){
                    expect(res.status).to.equal(200);
                    done();
                })
        })
        it("should let authenticated user create nodes in the database",function(done){
            var data = [];
            var stm = {
                "statement":  'CREATE (a:Artist {props})',
                "parameters": {
                    "props": {
                        "id": 2,
                        "name": "Britney Spears"
                    }
                }
            };
            data.push(stm);
            iutil.statementRequest(data)
                .then(function(){
                    done();
                },function(err){
                    done(err);
                })
        });
        it("should let authenticated user create relationships between nodes",function(done){
            var data = [];
            var stm = {
                "statement": 'CREATE (u:User {name:"User1"}),(f:User {name:"Friend1"})'
            };
            data.push(stm);
            iutil.statementRequest(data)
                .then(function(res){
                    var stm2 = {"statement":'MATCH (u:User),(f:User) ' +
                    'WHERE u.name="User1" AND f.name="Friend1"' +
                    'CREATE (u)-[:FRIEND]->(f)'};
                    var data = [];
                    data.push(stm2);
                    return iutil.statementRequest(data);
                })
                .then(function(){
                    done();
                })
                .catch(function(error){
                    done(error);
                }).done();
        });
        it("should allow a user to specify other users as friend.",function(done){
            User.schema.methods.friend(1,6)
                .then(function(res){
                    try{
                        expect(res.length).to.equal(2);
                        done();
                    } catch (e){
                        done(e);
                    }
                },function(err){
                    done(err);
                })
        });
        it("should return all friends of a User",function(done){
            var promise = User.schema.methods.findAllUserFriends(1);
            promise
                .then(function(data){
                    done();
                },function(err){
                    console.log(err);
                    done(err);
                });
        });


    })
    describe("The application",function(){

        it("should allow a user to specify other users as friend.",function(done){
            superagent
                .post("http://localhost:3000/users/friend")
                .send({user1:1,user2:6})
                .end(function(err,res){
                    try{
                        expect(err).to.be.null;
                        expect(res.status).to.equal(200);
                        expect(res.body.length).to.equal(2);
                        done();
                    } catch (e){
                        done(e);
                    }


                });
        });

        it("should allow a user to tag  any artist",function(done){
            superagent
                .post("http://localhost:3000/artists/1/tag")
                .send({user:1,tag:1})
                .end(function(err,res){
                    try{
                        expect(err).to.be.null;
                        expect(res.status).to.equal(200);
                        expect(res.body._id).to.equal(1);
                        done();
                    } catch (e){
                        done(e);
                    }


                });
        });
        it("should allow a users to find all his friends",function(done){
            superagent
                .get("http://localhost:3000/users/1/friends")
                .end(function(err,res){
                    try{
                        expect(err).to.be.null;
                        expect(res.status).to.equal(200);
                        expect(res.body.length).to.equal(2);
                        done();
                    } catch (e){
                        done(e);
                    }


                });
        });
    })
    after(function () {
    });


})
