/**
 * Created by rafaelpossas on 3/29/15.
 */
app.controller('mainCtrl', ['$scope', '$rootScope', 'alert','API_URL','$http', function ($scope, $rootScope, alert,API_URL,$http) {
    $scope.recByListeningCount;
    $scope.recByFriendsCount;
    $scope.recByTag;
    $scope.allTags;

    $scope.rankByListeningCount;
    $scope.rankByUserCount;
    $scope.rankByGivenTag;
    $scope.currentTag;

    var url_rank = API_URL + 'artists/rank';
    var url_tags = API_URL + 'tags';

    (function(){
        $('.nav li a').removeClass('active');
        $('.nav li:nth-child(1) > a').addClass('active');
        var url = API_URL + 'artists/recommend';

        $http({
            url: url,
            method: "GET",
            params: {type: "listeningCount",userid: $rootScope.user._id}
        }).success(function(data){
            $scope.recByListeningCount = data;
        });

        $http({
            url: url,
            method: "GET",
            params: {type: "friendsCount",userid: $rootScope.user._id}
        }).success(function(data){
            $scope.recByFriendsCount = data;
        });

        $http({
            url: url,
            method: "GET",
            params: {type: "tag",userid: $rootScope.user._id}
        }).success(function(data){
            $scope.recByTag = data;
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
        });

        $http.get(url_tags).success(function(tags){
            $scope.allTags = tags;
            $scope.currentTag = tags[0];
            $http({
                url: url_rank,
                method: "GET",
                params: {type: "givenTag",tag: tags[0].id}
            }).success(function(data){
                $scope.rankByGivenTag = data;
            });
        });


    })();
    $scope.getRankByGivenTag = function(){
        $http({
            url: url_rank,
            method: "GET",
            params: {type: "givenTag",tag: $scope.currentTag.id}
        }).success(function(data){
            $scope.rankByGivenTag = data;
        });
    }

}])