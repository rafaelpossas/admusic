/**
 * Created by rafaelpossas on 30/09/15.
 */
'use strict';
app.service('footer', ['$rootScope','$http','API_URL',function($rootScope,$http,API_URL){

    var play = function(artist){
        $rootScope.currentPlaying = {};
        var url = API_URL + 'artists/'+artist.id+'/listen';
        $http.post(url,{user: $rootScope.user._id}).success(function(artist){
            console.log(artist);
            $rootScope.currentPlaying = artist;
        });
    }

    return{
        play: play
    }
}]);
