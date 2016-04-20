angular.module('factoryOrdersPage', ['factoryNav', 'angularUtils.directives.dirPagination', 'daterangepicker', 'ui.bootstrap', 'ui.bootstrap.datetimepicker',
        'angucomplete-alt', 'ngFileUpload'])

    .controller('factoryOrdersController', function ($scope, factoryOrdersContentService, Upload, $timeout, $http) {
        $scope.orderList = {};
        $scope.factoryId = 'testfactory1';
        $scope.sortType = 'status';
        $scope.currentPage = 1;
        $scope.availableStatuses = [
            {
                name: 'processing',
                value: 0
            },
            {
                name: 'scheduled',
                value: 1
            },
            {
                name: 'working',
                value: 2
            },
            {
                name: 'finishing',
                value: 3
            },
            {
                name: 'ready',
                value: 4
            }
        ];
        $scope.pageSizes = [5, 10, 25, 50];
        $scope.itemsPerPage = 10;
        $scope.order = {};
        $scope.order.deadline = new Date();
        $scope.printerType = [];
        $scope.fieldRequired = true;
        $scope.isSaving = false;

        factoryOrdersContentService.getFactoryPrinterTypes().then(
            function (components) {
                $scope.printerType = components;
            },
            function (error) {
                console.log(error);
            });


        $scope.filterBy = {};

        $scope.filterBy.date = {
            startDate: moment().subtract(30, "days"),
            endDate: moment()
        };

        $scope.opts = {
            locale: {
                applyClass: 'btn-green',
                applyLabel: "Apply",
                fromLabel: "From",
                format: "YYYY-MM-DD",
                toLabel: "To",
                cancelLabel: 'Cancel',
                customRangeLabel: 'Custom range'
            },
            ranges: {
                'Last 3 Days': [moment().subtract(2, 'days'), moment()],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 14 Days': [moment().subtract(13, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()]
            }
        };

        $scope.setStartDate = function () {
            $scope.date.startDate = moment().subtract(4, "days").toDate();
        };

        $scope.setRange = function () {
            $scope.date = {
                startDate: moment().subtract(29, "days"),
                endDate: moment()
            };
        };

        factoryOrdersContentService.getFactoryOrders().then(
            function (components) {
                $scope.orderList = components;
            },
            function (error) {
                console.log(error);
            });

        $scope.applyFilters = function () {
            var filters = {
                'dates': {
                    'start': $scope.filterBy.date.startDate._d.getTime(),
                    'end': $scope.filterBy.date.endDate._d.getTime()
                },
                'machine': $scope.filterBy.machine ? $scope.filterBy.machine.name : "",
                'material': $scope.filterBy.material ? $scope.filterBy.material.name : "",
                'client': $scope.filterBy.client ? $scope.filterBy.client.username : "",
                'status': $scope.filterBy.status ? $scope.filterBy.status.name : ""
            };

            factoryOrdersContentService.getFactoryOrders(filters).then(
                function (components) {
                    $scope.orderList = components;
                },
                function (error) {
                    console.log(error + '\nReturning null');

                });
        };


        $scope.$watch('filterBy.date', function (newDate) {
        }, false);

        $scope.availableMachines = {};
        $scope.factoryOrder = {};
        factoryOrdersContentService.getFactoryMachines($scope.filterBy.factoryId).then(
            function (components) {
                $scope.availableMachines = components;
            },
            function (error) {
                console.log(error);
            });

        $scope.availableMaterials = {};
        factoryOrdersContentService.getFactoryMaterials($scope.filterBy.factoryId).then(
            function (components) {
                $scope.availableMaterials = components;
            },
            function (error) {
                console.log(error);
            });

        $scope.factoryClients = {};
        factoryOrdersContentService.getFactoryClients($scope.filterBy.factoryId).then(
            function (components) {
                $scope.factoryClients = components;
            },
            function (error) {
                console.log(error);
            });

        /*
         Datepicker functions
         */

        $scope.dateTimeNow = function () {
            $scope.date = new Date();
            $scope.date.setMinutes(0);
        };
        $scope.dateTimeNow();

        $scope.toggleMinDate = function () {
            $scope.minDate = $scope.minDate ? null : new Date();
        };

        $scope.maxDate = new Date('2014-06-22');
        $scope.toggleMinDate();

        $scope.dateOptions = {
            startingDay: 1,
            showWeeks: true
        };

        // Disable weekend selection
        $scope.disabled = function (calendarDate, mode) {
            return mode === 'day' && ( calendarDate.getDay() === 0 || calendarDate.getDay() === 6 );
        };

        $scope.hourStep = 1;
        $scope.minuteStep = 15;

        $scope.showMeridian = false;


        $scope.materialValid = true;

        $scope.placeNewOrder = function (file) {
            $scope.isSaving = true;
            var order = {
                'units': $scope.order.measurementUnits,
                'printerType': $scope.order.printerType,
                'material': $scope.order.material.originalObject.name,
                'comments': $scope.order.comments ? $scope.order.comments : "",
                'orderDate': new Date().getTime(),
                'orderDeadline': new Date($scope.date).getTime(),
                'client': $scope.order.client ? $scope.order.client.username : ""
            };

            file.upload = Upload.upload({
                url: '/orders/placeOrder',
                data: {
                    'file': file,
                    'order': order
                }
            });

            file.upload.then(function (response) {
                $timeout(function () {
                    file.result = response.data;
                    $scope.isSaving = false;

                    $scope.order = {};
                    $("#newOrderPU").modal("hide");
                    factoryOrdersContentService.getFactoryOrders().then(
                        function (components) {
                            $scope.orderList = components;
                            jQuery('#newOrderForm').trigger('reset');
                        },
                        function (error) {
                            console.log(error);
                        });
                });
            }, function (response) {
                if (response.status > 0)
                    $scope.errorMsg = response.status + ': ' + response.data;
            }, function (evt) {
                // Math.min is to fix IE which reports 200% sometimes
                file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
            });

        };

        $scope.orderStatus;
        $scope.orderStatuses = [];

        $scope.orderDetails = function (order) {
            jQuery("#processOrderPU").modal({backdrop: "static"});

            $('#processOrderPU').on('shown.bs.modal', function () {
                $('#calendar').fullCalendar({
                    header: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'month,agendaWeek,agendaDay'
                    },
                    slotDuration: '00:15:00',
                    allDaySlot: false,
                    defaultDate: new Date(),
                    eventOverlap: false,
                    timezone: 'local',
                    editable: false,
                    eventLimit: true, // allow "more" link when too many events
                    events: {
                        url: '/schedule/getMachineSchedule/',
                        data: function () { // a function that returns an object
                            return {
                                machineId: $('#factoryMachine').val()
                            };
                        }
                    },
                    loading: function (bool) {
                        $('#loading').toggle(bool);
                    },
                    businessHours: {
                        start: '10:00', // a start time (10am in this example)
                        end: '18:00', // an end time (6pm in this example)

                        dow: [1, 2, 3, 4, 5]
                        // days of week. an array of zero-based day of week integers (0=Sunday)
                        // (Monday-Thursday in this example)
                    },
                    dayClick: function (date, jsEvent, view) {

                        if (view.name == 'month' || view.name == 'agendaWeek') {
                            $('#calendar').fullCalendar('gotoDate', date);
                            $('#calendar').fullCalendar('changeView', 'agendaDay');
                        }
                    }
                });
                $('#calendar').fullCalendar('refetchEvents');
            });

            $scope.order = angular.copy(order);

            /*
             set status
             */
            $scope.orderStatuses.length = 0;
            var found = false;
            $scope.availableStatuses.forEach(function (status, index) {
                if (!found)
                    $scope.orderStatuses.push({
                        'name': status.name,
                        'disabled': true
                    });
                else
                    $scope.orderStatuses.push({
                        'name': status.name,
                        'disabled': false
                    });

                if (status.name == $scope.order.status) {
                    found = true;
                    $scope.order.orderStatus = $scope.orderStatuses[index];
                    $scope.orderStatuses[index].disabled = false;
                }

            });

            var found = false;
            for (i = 0; i < $scope.availableMaterials.length; i++) {
                if ($scope.order.materialName == $scope.availableMaterials[i].name) {
                    $scope.$broadcast('angucomplete-alt:changeInput', "material1", $scope.availableMaterials[i]);
                    $scope.order.material = $scope.availableMaterials[i];
                    found = true;
                    break;
                }
            }
            if (!found) {
                $scope.$broadcast('angucomplete-alt:clearInput', "material1");
            }

            $scope.order.orderDuration = floatToHour($scope.order.duration);
            if ($scope.order.startDate)
                $scope.date = new Date($scope.order.startDate);
            else {
                $scope.date = new Date();
                $scope.date.setMinutes(0);
            }

        };

        $scope.clientOrderDetails = function (order) {
            jQuery("#orderDetailsPU").modal({backdrop: "static"});
            $scope.order = angular.copy(order);
            $scope.order.material = order.material;
        };

        $scope.$watch("date", function (value) {
            $scope.checkDate();
        }, true);

        $scope.$watch("order.machine", function () {
            $scope.checkDate();
        });

        $scope.duration = 0;
        $scope.$watch('order.orderDuration', function () {
            var duration = filterTime($scope.order.orderDuration);
            $scope.checkDate();
            $scope.processOrderForm.orderDuration.$setValidity("value", duration > 0);
        });

        $scope.dateValid = true;
        $scope.checkDate = function () {
            if (!$scope.order.machine)
                return;
            var duration = filterTime($scope.order.orderDuration);
            var checkValidity = {
                'orderId': $scope.order.id,
                'machine': $scope.order.machine,
                'startDate': parseInt($scope.date.getTime()),
                'endDate': parseInt(($scope.date.getTime() + duration * 3600 /*seconds */ * 1000 /*miliseonds*/))
            };

            $http.post('/schedule/isFreeSlot', checkValidity)
                .success(function (response) {
                    if (response) {
                        $scope.dateValid = true;
                    }
                    else {
                        $scope.dateValid = false;
                    }
                })
                .error(function (error) {
                    console.log('error: ' + error);
                    $scope.dateValid = false;
                });
        };

        $scope.$watch('dateValid', function () {
            if (!$scope.dateValid)
                $scope.processOrderForm.dateValid.$setValidity("value", false);
            else
                $scope.processOrderForm.dateValid.$setValidity("value", true);
        });


        $scope.submitOrder = function () {
            $scope.isSaving = true;
            var duration = filterTime($scope.order.orderDuration);
            var orderDetails =
            {
                'orderId': $scope.order.id,
                'machine': $scope.order.machine,
                'material': $scope.order.material,
                'startDate': parseInt($scope.date.getTime()),
                'endDate': parseInt(($scope.date.getTime() + duration * 3600 /*seconds */ * 1000 /*miliseonds*/)),
                'status': $scope.order.orderStatus.name
            };

            var data = angular.toJson(orderDetails);

            $http.post('/orders/scheduleOrder', data)
                .success(function () {
                    factoryOrdersContentService.getFactoryOrders().then(
                        function (components) {
                            $scope.orderList = components;
                            jQuery("#processOrderPU").modal('hide');
                            $scope.order = {};
                            $scope.date = new Date();
                        },
                        function (error) {
                            console.log(error);
                        });

                })
                .error(function (error) {
                    console.log('error: ' + error);
                }).finally(function () {
                $scope.isSaving = false;
            });
        };

        jQuery(document).ready(function () {
            $("#newOrder").click(function () {
                $scope.order = {};
                $scope.date = new Date();
                $("#newOrderPU").modal({backdrop: "static"});
            });

            var hash = window.location.hash;
            console.log(hash);
            if (hash == '#newOrder') {
                $scope.order = {};
                $scope.date = null;
                $scope.date = new Date();
                $("#newOrderPU").modal({backdrop: "static"});
                window.location.hash = '';
            }


            $(window).on('hashchange', function () {
                var hash = window.location.hash;
                if (hash == '#newOrder') {
                    $scope.order = {};
                    $scope.date = null;
                    $scope.date = new Date();
                    $("#newOrderPU").modal({backdrop: "static"});
                    window.location.hash = '';
                }
            });
        });
    })
    .factory('factoryOrdersContentService', function ($q, $http) {
        return {
            getFactoryOrders: function (filters) {
                var deferred = $q.defer(),
                    httpPromise = $http.post('/orders/getFactoryOrders', JSON.stringify(filters));

                httpPromise.success(function (components) {
                        deferred.resolve(components);
                    })
                    .error(function (error) {
                        console.log(error);
                        return null;
                    });

                return deferred.promise;
            },
            getOrderById: function (orderId) {

                var deferred = $q.defer(),
                    httpPromise = $http.get('/orders/' + orderId);

                httpPromise.success(function (components) {
                        deferred.resolve(components);
                    })
                    .error(function (error) {
                        console.log(error);
                        return null;
                    });

                return deferred.promise;
            },
            getFactoryMachines: function (factoryId) {
                var factory = {'factoryId': factoryId};
                var deferred = $q.defer(),
                    httpPromise = $http.post('/home/api/getFactoryMachines', JSON.stringify(factory));

                httpPromise.success(function (components) {
                        deferred.resolve(components);
                    })
                    .error(function (error) {
                        console.log(error);
                        return null;
                    });

                return deferred.promise;
            },
            getFactoryMaterials: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/home/api/getFactoryMaterials');

                httpPromise.success(function (components) {
                        deferred.resolve(components);
                    })
                    .error(function (error) {
                        console.log(error);
                        return null;
                    });

                return deferred.promise;
            },
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
            },
            getFactoryPrinterTypes: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/factory/getPrinterTypes');

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
            if (input == null || input == 0) {
                return "-";
            }

            var _date = $filter('date')(new Date(parseInt(input)),
                'MMM dd yyyy HH:mm');

            return _date.toString();
        };
    });


var filterTime = function filterTime(time) {
    if (!time)
        return;


    // Number of decimal places to round to
    var decimal_places = 2;

    // Maximum number of hours before we should assume minutes were intended. Set to 0 to remove the maximum.
    var maximum_hours = 15;

    // 3
    var int_format = time.match(/^\d+$/);

    // 1:15
    var time_format = time.match(/([\d]*):([\d]+)/);

    // 10m
    var minute_string_format = time.toLowerCase().match(/([\d]+)m/);

    // 2h
    var hour_string_format = time.toLowerCase().match(/([\d]+)h/);

    if (time_format != null) {
        hours = parseInt(time_format[1]);
        minutes = parseFloat(time_format[2] / 60);
        time = hours + minutes;
    } else if (minute_string_format != null || hour_string_format != null) {
        if (hour_string_format != null) {
            hours = parseInt(hour_string_format[1]);
        } else {
            hours = 0;
        }
        if (minute_string_format != null) {
            minutes = parseFloat(minute_string_format[1] / 60);
        } else {
            minutes = 0;
        }
        time = hours + minutes;
    } else if (int_format != null) {
        // Entries over 15 hours are likely intended to be minutes.
        time = parseInt(time);
        if (maximum_hours > 0 && time > maximum_hours) {
            time = (time / 60).toFixed(decimal_places);
        }
    }

    // make sure what ever we return is a 2 digit float
    time = parseFloat(time).toFixed(decimal_places);

    return time;
};

var floatToHour = function floatToHour(hours) {
    var seconds = hours * 3600;
    var date = new Date(seconds * 1000);
    var hh = date.getUTCHours();
    var mm = date.getUTCMinutes();


    if (hh < 10) {
        hh = "0" + hh;
    }
    if (mm < 10) {
        mm = "0" + mm;
    }

// This formats your string to HH:MM:SS
    var t = hh + "h " + mm + "m";
    return t;
};