/**
 * Created by rafaelpossas on 28/09/15.
 */
var TagsController = function () {
    var Tag = require('../models/Tag');

    var getAllTags = function(req,res,next){
        Tag.schema.methods.getAllTags()
            .then(function(data){
                res.status(200).send(data);
            }).catch(function(err){
                next(err);
            })
    }


    return {
        getAllTags: getAllTags
    }
}();

module.exports = TagsController;
