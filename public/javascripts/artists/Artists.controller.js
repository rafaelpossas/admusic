app.controller('artistsCtrl', ['$scope','$rootScope','API_URL','$http','footer','alert',function ($scope,$rootScope,API_URL,$http,footer,alert) {

    $scope.artists;
    $scope.searchTerm;
    $scope.currentArtist;

    $scope.allTags;
    $scope.currentTag;

    var url = API_URL + 'artists';
    var url_tags = API_URL + 'tags';

    $rootScope.artist = {};
    (function(){
        $('.nav li a').removeClass('active');
        $('.nav li:nth-child(2) > a').addClass('active');
    })();
    $scope.play = function(artist){
        footer.play(artist);
    }
    $scope.getDescription = function(artist){
        var url = API_URL + 'artists/'+artist._id;
        if(!$scope.allTags){
            $http.get(url_tags).success(function(tags){
                $scope.allTags = tags;
                $scope.currentTag = tags[0];
            });
        }
        $http.get(url).success(function(artist){
            $scope.currentArtist = artist;
            $("#artistModal").modal();
        });

    }
    $scope.$watch('searchTerm', function(nVal, oVal) {
        if (nVal !== oVal) {
            $http({
                url: url,
                method: "GET",
                params: {name: $scope.searchTerm}
            }).success(function(data){
                $scope.artists = data;
            });
        }
    })
    $scope.addTag = function(){
        var exists = false;
        $scope.currentArtist.tags.forEach(function(ctag){
            if($scope.currentTag.id === ctag._id && $scope.currentTag.description === ctag.description ){
                exists = true;
            }
        });
        if(exists){
            console.log("Tag already exists");
        }else{
            var url = API_URL + 'artists/'+$scope.currentArtist._id+"/tag";
            $http.post(url,{user: $rootScope.user._id,tag: $scope.currentTag._id})
                .success(function(res){
                    $scope.currentArtist = res;
                })
                .error(function(err){
                    alert('warning',err.message);
                });
        }
    }
}]);