angular.module('clientHomePage', [])
    .controller('clientHomePageController', function ($scope, clientHomePageContentService) {
        $scope.userFactory = {};
        clientHomePageContentService.getUserFactory().then(
            function (components) {
                $scope.userFactory = components;
            },
            function (error) {
                console.log(error);
            });
    })
    .factory('clientHomePageContentService', function ($q, $http) {
        return {
            getUserFactory: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/factory/getUserFactory');

                httpPromise.success(function (components) {
                        deferred.resolve(components);
                    })
                    .error(function (error) {
                        console.log(error);
                        return null;
                    });

                return deferred.promise;
            }
        };
    });