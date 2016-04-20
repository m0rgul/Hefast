angular.module('factoryClientsPage', ['factoryNav'])
    .controller('factoryClientsController', function ($scope, factoryClientsContentService, $http) {
        $scope.factoryClients = [];
        $scope.isSaving = false;
        factoryClientsContentService.getFactoryClients().then(
            function (components) {
                $scope.factoryClients = components;
            },
            function (error) {
                console.log(error);
            });

        $scope.addClient = function () {
            $scope.isSaving = true;

            $http.post('/clients', angular.toJson($scope.newClient))
                .success(function () {
                    $scope.factoryClients = {};
                    factoryClientsContentService.getFactoryClients().then(
                        function (components) {
                            $scope.factoryClients = components;
                            $scope.newClient = {};
                            $("#newClientPU").modal('hide');
                        },
                        function (error) {
                            console.log(error + '\nReturning null');
                        });
                })
                .error(function (error) {
                    console.log(error);
                })
                .finally(function () {
                    $scope.isSaving = false;
                });
        };

        $scope.editClient = function (client) {
            console.log(client);
            $scope.newClient = angular.copy(client);
            $scope.newClient.edit = true;
            $("#newClientPU").modal({backdrop: "static"});
        };

        $scope.updateClient = function () {
            $scope.isSaving = true;

            $http.put('/clients', angular.toJson($scope.newClient))
                .success(function () {
                    $scope.factoryClients = {};
                    factoryClientsContentService.getFactoryClients().then(
                        function (components) {
                            $scope.factoryClients = components;
                            $scope.newClient = {};
                            $("#newClientPU").modal('hide');
                        },
                        function (error) {
                            console.log(error + '\nReturning null');
                        });
                })
                .error(function (error) {
                    console.log(error);
                }).finally(function () {
                $scope.isSaving = false;

            });
        };

        $scope.deleteClient = function () {
            $scope.isSaving = false;

            $http.delete('/clients/' + $scope.newClient.username)
                .success(function () {
                    $scope.factoryClients = {};
                    factoryClientsContentService.getFactoryClients().then(
                        function (components) {
                            $scope.factoryClients = components;
                            $scope.newClient = {};
                            $("#newClientPU").modal('hide');
                        },
                        function (error) {
                            console.log(error + '\nReturning null');
                        });
                })
                .error(function (error) {
                    console.log(error);
                })
                .finally(function () {
                    $scope.isSaving = false;
                });
        };


        /*
         jQuery stuff
         */
        $(document).ready(function () {

            $("#newClient").click(function () {
                $scope.$apply(function () {
                    $scope.newClient = {edit: false};
                });

                $("#newClientPU").modal({backdrop: "static"});
            });

            var hash = window.location.hash;
            if (hash == '#newClient') {
                $scope.$apply(function () {
                    $scope.newClient = {edit: false};
                });
                $("#newClientPU").modal({backdrop: "static"});
                window.location.hash = '';
            }

            $(window).on('hashchange', function () {
                var hash = window.location.hash;
                if (hash == '#newClient') {
                    $scope.$apply(function () {
                        $scope.newClient = {edit: false};
                    });
                    $("#newClientPU").modal({backdrop: "static"});
                    window.location.hash = '';
                }
            });
        });
    })
    .factory('factoryClientsContentService', function ($q, $http) {
        return {
            getFactoryClients: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/clients/factoryClients');

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
    .filter('datetime', function ($filter) {
        return function (input) {
            if (input == null) {
                return "";
            }

            var _date = $filter('date')(new Date(parseInt(input)),
                'MMM dd yyyy HH:mm:ss');

            return _date.toString();
        };
    });


