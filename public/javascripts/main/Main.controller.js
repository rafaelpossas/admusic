/**
 * Created by rafaelpossas on 3/29/15.
 */
app.controller('mainCtrl', ['$scope', '$rootScope', 'alert','API_URL','$http', function ($scope, $rootScope, alert,API_URL,$http) {
    $scope.recommendations;
    $scope.popular;
    $scope.allTags;

    $scope.rankByListeningCount;
    $scope.rankByUserCount;
    $scope.rankByGivenTag;
    $scope.currentTag;
    $scope.currentRec;
    $scope.currentPop;

    $scope.recTypes = [
        {
            description: "By Listening Count",
            value: "listeningCount"
        },
        {
            description: "By Friends Count",
            value: "friendsCount"
        },
        {
            description: "By Random Tag",
            value: "tag"
        }
    ];

    $scope.popTypes = [
        {
            description: "By Listening Count",
            value: "listeningCount"
        },
        {
            description: "By User Count",
            value: "userCount"
        },
    ];

    var url_rank = API_URL + 'artists/rank';
    var url_tags = API_URL + 'tags';
    var url = API_URL + 'artists/recommend';

    (function(){
        $('.nav li a').removeClass('active');
        $('.nav li:nth-child(1) > a').addClass('active');
        $scope.currentRec = $scope.recTypes[0];
        $scope.currentPop = $scope.popTypes[0];
        $http({
            url: url,
            method: "GET",
            params: {type: $scope.currentRec.value,userid: $rootScope.user._id}
        }).success(function(data){
            $scope.recommendations = data;
        });
        $http({
            url: url_rank,
            method: "GET",
            params: {type: $scope.currentPop.value,userid: $rootScope.user._id}
        }).success(function(data){
            $scope.popular = data;
        });
        $http.get(url_tags).success(function(tags){
            $scope.allTags = tags;
        });
        /*
        $http.get(url_tags).success(function(tags){
            $scope.allTags = tags;
        });

     $http({
            url: url_rank,
            method: "GET",
            params: {type: "listeningCount",userid: $rootScope.user._id}
        }).success(function(data){
            $scope.rankByListeningCount = data;
        });

        $http({
            url: url_rank,
            method: "GET",
            params: {type: "userCount",userid: $rootScope.user._id}
        }).success(function(data){
            $scope.rankByUserCount = data;
        });*/


    })();
    $scope.recommendArtists = function(){
        $http({
            url: url,
            method: "GET",
            params: {type: $scope.currentRec.value,userid: $rootScope.user._id}
        }).success(function(data){
            $scope.recommendations = data;
        });

    }
    $scope.popularArtists = function(){
        $http({
            url: url_rank,
            method: "GET",
            params: {type: $scope.currentPop.value,userid: $rootScope.user._id}
        }).success(function(data){
            $scope.popular = data;
        });


    }
    $scope.getRankByGivenTag = function(){
        $http({
            url: url_rank,
            method: "GET",
            params: {type: "givenTag",tag: $scope.currentTag._id}
        }).success(function(data){
            $scope.rankByGivenTag = data;
        });
    }

}])