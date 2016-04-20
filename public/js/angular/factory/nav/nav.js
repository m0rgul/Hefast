angular.module('factoryNav',[])
    .controller('mainFactoryNavigation', function ($scope, factoryNavContentService) {
        $scope.navInfo = {};
        factoryNavContentService.getNavInfo().then(
            function (components) {
                $scope.navInfo = components;
            },
            function (error) {
                console.log(error);
            });
    })
    .factory('factoryNavContentService', function ($q, $http) {
        return {
            getNavInfo: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/factory/getNavInfo');

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
    })
    .filter('randomSrc', function () {
        return function (input) {
            if (input)
                return input + '?r=' + Math.round(Math.random() * 999999);
        }
    });