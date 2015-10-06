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
var Tag = require("../models/Tag");
var Artist = require("../models/Artist");
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
        it("should get all tags",function(done){
            Tag.schema.methods.getAllTags()
                .then(function(tags){
                    try{
                        expect(tags.length).to.equal(10);
                        done();
                    } catch (e){
                        done(e);
                    }
                })
        });
    });
    describe("The application",function(){
        it("should get all tags",function(done){
            superagent
                .get("http://localhost:3000/tags/")
                .end(function(err,res){
                    try{
                        expect(err).to.be.null;
                        expect(res.status).to.equal(200);
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
