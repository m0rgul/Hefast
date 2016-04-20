angular.module('factoryMainPage', ['factoryNav'])
    .controller('factoryMainPageController', function ($scope, factoryMainPageContentService) {
        $scope.factoryInfo = {};
        factoryMainPageContentService.getFactoryContent().then(
            function (components) {
                $scope.factoryInfo = components;
            },
            function (error) {
                console.log(error);
            });
    })
    .factory('factoryMainPageContentService', function ($q, $http) {
        return {
            getFactoryContent: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/factory/getFactoryInfo');

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