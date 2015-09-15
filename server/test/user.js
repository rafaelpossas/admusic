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
require('../config/mongoose.js')(global.config.db);

describe('User', function () {

    var totalDocuments;

    before(function () {
        totalDocuments = 0;
    });
    describe("The database",function(){
        it("should let user query for recomendation based on friend's top artists",function(done){
            this.timeout(10000)
            var promise = Artist.schema.methods.rankTopFiveArtistsByUserCount();
            promise.then(function(col){
                console.log(col);
                done();
            })
        })
    })
    after(function (done) {
        done();
    });


})