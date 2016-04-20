angular.module('factoryEditPage')
    .factory('factoryEditContentService', function ($q, $http) {
        return {
            getFactoryDetails: function () {
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
            },

            getRecurringEvents: function (machineId) {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/machine/getRecurringEvents/' + machineId);

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
