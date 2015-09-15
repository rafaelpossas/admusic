/**
 * Created by rafaelpossas on 2/09/15.
 */

var FacultiesController = function(){
    var Faculty = require('../models/Faculty');

    var getFaculties = function(req,res,next){
        Faculty.model.find({}).exec(function(err,collection){
            if(err) next(err);
            else
                res.status(200).send(collection);
        });
    }
    var saveFaculty = function(req,res,next){
        var promise = Faculty.schema.methods.saveFaculty(req.body.name);
        promise.then(function(doc){
            res.status(200).send({faculty:doc});
        },function(error){
            next(error);
        })
    }
    return {
        getFaculties: getFaculties,
        saveFaculty: saveFaculty
    }
}();

module.exports = FacultiesController;