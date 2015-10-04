var Tag = function(){
    var mongoose = require('mongoose');
    var fs = require('fs');
    var Q = require('q');

    var neo4j = require('../services/neo4j');

    var TagSchema = mongoose.Schema({
        _id: Number,
        description: {type:String,required: '{PATH} is required'}
    });

    TagSchema.methods = {
        getAllTags: function(){
            var defer = Q.defer();
            var qry = {
                "query": "MATCH (t:Tag) return t.id,t.description",
            }
            neo4j.cypherRequest(qry)
                .then(function(res){
                    var tags = [];
                    res.body.data.forEach(function(tag){
                        tags.push({
                            id: tag[0],
                            description: tag[1]
                        });
                    });
                    defer.resolve(tags);
                })
            return defer.promise;
        }

    };
    var _model = mongoose.model('Tag',TagSchema);

    return{
        model: _model,
        schema: TagSchema
    }

}();


module.exports = Tag;
