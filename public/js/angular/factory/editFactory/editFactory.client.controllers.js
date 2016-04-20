angular.module('factoryEditPage')
    .controller('factoryEditController', function ($scope, factoryEditContentService, Upload, $timeout, $http) {
        $scope.isSaving = false;
        //<editor-fold desc="FactoryInfo">
        $scope.factoryInfo = {};
        $scope.noInfo = false;
        $scope.disableMat = false;
        $scope.disableMach = false;
        factoryEditContentService.getFactoryDetails().then(
            function (components) {
                $scope.factoryInfo = components;
                $scope.refreshWarnings();
            },
            function (error) {
                console.log(error);
            });

        $scope.refreshWarnings = function () {
            if ($scope.factoryInfo.machines.length == 0 || $scope.factoryInfo.materials.length == 0)
                $scope.noInfo = true;
            else
                $scope.noInfo = false;

            if (!$scope.factoryInfo.description || !$scope.factoryInfo.logo)
                $scope.disableMat = true;
            else
                $scope.disableMat = false;

            if (!$scope.factoryInfo.description || !$scope.factoryInfo.logo || $scope.factoryInfo.materials.length < 1)
                $scope.disableMach = true;
            else
                $scope.disableMach = false;
        };

        $scope.editFactoryInfo = function () {
            $scope.newFactoryInfo = {};
            $scope.newFactoryInfo.factoryName = $scope.factoryInfo.factoryName;
            $scope.newFactoryInfo.factoryEmail = $scope.factoryInfo.factoryEmail;
            $scope.newFactoryInfo.description = $scope.factoryInfo.description;
            jQuery("#editFactoryPU").modal({backdrop: "static"});
        };

        $scope.updateFactoryDetails = function (file) {
            $scope.isSaving = true;

            var factoryInfo = {
                factoryName: $scope.newFactoryInfo.factoryName,
                factoryEmail: $scope.newFactoryInfo.factoryEmail,
                description: $scope.newFactoryInfo.description
            };

            if (file) {

                file.upload = Upload.upload({
                    url: '/factoryDetails',
                    data: {
                        'file': file,
                        'factoryInfo': factoryInfo
                    }
                });

                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        $scope.isSaving = false;

                        $scope.newFactoryInfo = {};
                        $scope.factoryInfo = {};
                        $("#editFactoryPU").modal("hide");
                        factoryEditContentService.getFactoryDetails().then(
                            function (components) {
                                $scope.factoryInfo = components;
                                $scope.refreshWarnings();
                                jQuery('#factoryDetailForm').trigger('reset');
                                $scope.logoFile = null;
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
            } else {
                $http.post('/factoryDetails', {factoryInfo: factoryInfo})
                    .success(function () {
                        $scope.newFactoryInfo = {};
                        $scope.factoryInfo = {};
                        $("#editFactoryPU").modal("hide");
                        factoryEditContentService.getFactoryDetails().then(
                            function (components) {
                                jQuery('#factoryDetailForm').trigger('reset');
                                $scope.factoryInfo = components;
                                $scope.refreshWarnings();
                            },
                            function (error) {
                                console.log(error);
                            });

                    })
                    .error(function (error) {
                        console.log('error: ' + error);
                    })
                    .finally(function () {
                        $scope.isSaving = false;
                    });
            }
        };
        //</editor-fold>

        //<editor-fold desc="MaterialOperations">
        $scope.materialDetails = function (material, index) {
            $scope.matEdit = {};
            $scope.matEdit = angular.copy(material);
            $scope.matEdit.new = false;
            $scope.matEdit.stock = parseFloat($scope.matEdit.stock);
            $scope.matEdit.index = index;
            jQuery('#materialDetailPU').modal();
        };

        $scope.deleteMaterial = function () {
            var index = $scope.matEdit.index;
            var matArray = angular.copy($scope.factoryInfo.materials);
            matArray.splice(index, 1);

            var data = {
                'material': $scope.factoryInfo.materials[index],
                'matArray': matArray
            };

            if ($scope.factoryInfo.machines != []) {
                var matName = $scope.factoryInfo.materials[index].name;
                var newMachineArray = [];
                $scope.factoryInfo.machines.forEach(function (machine) {
                    if (machine.materials && machine.materials.length > 0)
                        var i = machine.materials.indexOf(matName);
                    else
                        i = -1;
                    if (i != -1) {
                        machine.materials.splice(i, 1);
                    }
                    newMachineArray.push(machine);
                });
                data.newMachineArray = newMachineArray;
            }

            var data = angular.toJson(data);
            $http.post('/materials/delete', data)
                .success(function () {
                    $scope.factoryInfo = {};
                    factoryEditContentService.getFactoryDetails().then(
                        function (components) {
                            $scope.factoryInfo = components;
                            jQuery('#materialDetail').trigger('reset');
                            $scope.refreshWarnings();
                            $("#materialDetailPU").modal("hide");
                        },
                        function (error) {
                            console.log(error + '\nReturning null');
                        });
                })
                .error(function (error) {
                    console.log(error);
                });
        };

        $scope.newMaterial = function () {
            $scope.matEdit = {};
            $scope.matEdit.new = true;
            jQuery('#materialDetailPU').modal();
        };

        $scope.submitMaterial = function (file) {
            $scope.isSaving = true;

            var material =
            {
                'name': $scope.matEdit.name,
                'description': $scope.matEdit.description,
                'stock': parseFloat($scope.matEdit.stock)
            };


            if ($scope.matEdit.new) {
                material.matArray = $scope.factoryInfo.materials != undefined ? $scope.factoryInfo.materials : [];
                if (file) {
                    file.upload = Upload.upload({
                        url: '/materials',
                        data: {
                            'file': file,
                            'material': material
                        }
                    });
                } else {
                    $http.post('/materials', {material: material})
                        .success(function () {
                            $scope.factoryInfo = {};
                            factoryEditContentService.getFactoryDetails().then(
                                function (components) {
                                    $scope.factoryInfo = components;
                                    jQuery('#materialDetail').trigger('reset');
                                    $scope.refreshWarnings();
                                    $scope.matEdit = {};
                                    $("#materialDetailPU").modal("hide");
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
                }

            } else {
                var index = $scope.matEdit.index;
                var matArray = angular.copy($scope.factoryInfo.materials);
                matArray[index] = $scope.matEdit;
                material.matArray = matArray;
                if (file) {
                    file.upload = Upload.upload({
                        url: '/materials/update',
                        data: {
                            'file': file,
                            'material': material
                        }
                    });
                } else {
                    $http.post('/materials/update', {material: material})
                        .success(function () {
                            $scope.factoryInfo = {};
                            factoryEditContentService.getFactoryDetails().then(
                                function (components) {
                                    $scope.factoryInfo = components;
                                    jQuery('#materialDetail').trigger('reset');
                                    $scope.refreshWarnings();
                                    $scope.matEdit = {};
                                    $("#materialDetailPU").modal("hide");
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
                }
            }

            if (file) {
                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        $scope.isSaving = false;

                        $scope.factoryInfo = {};
                        factoryEditContentService.getFactoryDetails().then(
                            function (components) {
                                $scope.factoryInfo = components;
                                jQuery('#materialDetail').trigger('reset');
                                $scope.refreshWarnings();
                                $scope.matEdit = {};
                                $("#materialDetailPU").modal("hide");
                                $scope.matImage = null;
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
            }

        };
        //</editor-fold>

        //<editor-fold desc="Machine operations">
        $scope.printerType = [
            {'code': 'fdm', 'display': 'Fused Deposition Modeling'},
            {'code': 'sls', 'display': 'Selective Laser Sintering'},
            {'code': 'sladlp', 'display': 'Stereolithography + Digital Light Processing'},
            {'code': 'jet ', 'display': 'Material Jetting'},
            {'code': 'paper ', 'display': 'Paper 3D printing'},
            {'code': 'ms ', 'display': 'Metal Sintering'}
        ];

        $scope.recurringEvents = [];
        $scope.recurring = {};
        $scope.recurring.type = 0;

        $scope.machineDetails = function (machine, index) {

            $scope.machEdit = angular.copy(machine);
            for (i = 0; i < $scope.printerType.length; i++) {
                if ($scope.machEdit.technology.code == $scope.printerType[i].code) {
                    $scope.machEdit.technology = $scope.printerType[i];
                    break;
                }
            }
            $scope.machEdit.new = false;
            $scope.machEdit.index = index;

            jQuery('#machineDetailPU').modal();

            var machineId = $scope.machEdit.name;
            factoryEditContentService.getRecurringEvents(machineId).then(
                function (components) {
                    $scope.recurringEvents = components;
                },
                function (error) {
                    console.log(error);
                });
        };

        $scope.newMachine = function () {
            $scope.machEdit = {};
            $scope.machEdit.new = true;

            jQuery('#machineDetailPU').modal();
        };

        $scope.daysOfMonth = [];
        for (i = 1; i <= 31; i++) {
            $scope.daysOfMonth.push(i);
        }

        $scope.addRecurringEvent = function () {

            var sTime = parseFloat(filterTime($scope.recurring.startTime));
            var eTime = sTime + parseFloat(filterTime($scope.recurring.duration));

            var newEvent = {
                idReccurenceType: $scope.recurring.type,
                title: $scope.recurring.title,
                startHours: sTime,
                endHours: eTime
            };

            if (newEvent.idReccurenceType == 2) {
                newEvent.dayOfWeek = $scope.recurring.dayOfWeek;
            }

            if (newEvent.idReccurenceType == 3) {
                newEvent.dayOfMonth = $scope.recurring.dayOfMonth;
            }

            $scope.recurringEvents.push(newEvent);
        };

        $scope.deleteEvent = function (index) {
            $scope.recurringEvents.splice(index, 1);
        };

        $scope.submitMachine = function (file) {
            $scope.isSaving = true;

            var machine =
            {
                'name': $scope.machEdit.name,
                'description': $scope.machEdit.description,
                'technology': $scope.machEdit.technology,
                'materials': $scope.machEdit.materials,
                'recurringEvents': $scope.recurringEvents
            };

            if ($scope.machEdit.new) {
                machine.machineArray = $scope.factoryInfo.machines != undefined ? $scope.factoryInfo.machines : [];
                if (file) {
                    file.upload = Upload.upload({
                        url: '/machine/addMachine',
                        data: {
                            'file': file,
                            'machine': angular.toJson(machine)
                        }
                    });
                } else {
                    $http.post('/machine/addMachine', {machine: angular.toJson(machine)})
                        .success(function () {
                            $scope.factoryInfo = {};
                            factoryEditContentService.getFactoryDetails().then(
                                function (components) {
                                    jQuery('#mchineDetail').trigger('reset');
                                    $scope.recurringEvents.length = 0;
                                    $scope.recurring = {};
                                    $scope.recurring.type = 0;
                                    $scope.factoryInfo = components;
                                    $scope.refreshWarnings();
                                    $scope.machEdit = {};
                                    jQuery('#machineDetailPU').modal('hide');

                                },
                                function (error) {
                                    console.log(error);
                                });
                        })
                        .error(function (error) {
                            console.log(error);
                        })
                        .finally(function () {
                            $scope.isSaving = false;
                        });
                }

            } else {
                var index = $scope.machEdit.index;
                var machineArray = angular.copy($scope.factoryInfo.machines);
                machineArray[index] = $scope.machEdit;
                machine.machineArray = machineArray;
                if (file) {
                    file.upload = Upload.upload({
                        url: '/machine/updateMachine',
                        data: {
                            'file': file,
                            'machine': angular.toJson(machine)
                        }
                    });
                } else {
                    $http.post('/machine/updateMachine', {machine: angular.toJson(machine)})
                        .success(function () {
                            $scope.factoryInfo = {};
                            factoryEditContentService.getFactoryDetails().then(
                                function (components) {
                                    jQuery('#mchineDetail').trigger('reset');
                                    $scope.recurringEvents.length = 0;
                                    $scope.recurring = {};
                                    $scope.recurring.type = 0;
                                    $scope.factoryInfo = components;
                                    $scope.refreshWarnings();
                                    $scope.machEdit = {};
                                    jQuery('#machineDetailPU').modal('hide');


                                },
                                function (error) {
                                    console.log(error);
                                });
                        })
                        .error(function (error) {
                            console.log(error);
                        })
                        .finally(function () {
                            $scope.isSaving = false;
                        });
                }

            }
            if (file) {
                file.upload.then(function (response) {
                    $timeout(function () {
                        file.result = response.data;
                        $scope.isSaving = false;

                        $scope.factoryInfo = {};
                        factoryEditContentService.getFactoryDetails().then(
                            function (components) {
                                jQuery('#mchineDetail').trigger('reset');
                                $scope.recurringEvents.length = 0;
                                $scope.recurring = {};
                                $scope.recurring.type = 0;
                                $scope.factoryInfo = components;
                                $scope.refreshWarnings();
                                $scope.machEdit = {};
                                jQuery('#machineDetailPU').modal('hide');
                                $scope.machImage = null;

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
            }
        };

        $scope.deleteMachine = function () {
            var index = $scope.machEdit.index;
            var machineArray = angular.copy($scope.factoryInfo.machines);
            machineArray.splice(index, 1);

            var data = {
                'machine': $scope.factoryInfo.machines[index],
                'machineArray': machineArray
            };

            data = angular.toJson(data);

            $http.post(
                '/machine/delete', data)
                .success(function () {
                    $scope.factoryInfo = {};
                    factoryEditContentService.getFactoryDetails().then(
                        function (components) {
                            $scope.factoryInfo = components;
                            jQuery('#mchineDetail').trigger('reset');
                            $scope.recurringEvents = [];
                            $scope.recurring = {};
                            $scope.recurring.type = 0;
                            $scope.refreshWarnings();
                            jQuery('#machineDetailPU').modal('hide');
                        },
                        function (error) {
                            console.log(error + '\nReturning null');
                        });
                })
                .error(function (error) {
                    console.log(error);
                });
        };
        //</editor-fold>
    });


/**
 * jQuery stuff
 */

$(document).on('change', '.btn-file :file', function () {
    var input = $(this),
        numFiles = input.get(0).files ? input.get(0).files.length : 1,
        label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
    input.trigger('fileselect', [numFiles, label]);
});

$(document).ready(function () {
    $('.btn-file :file').on('fileselect', function (event, numFiles, label) {
        if ($('#editFactoryPU').css('display') != 'none')
            $('#logoFileSelectText').val(label);
        else if ($('#machineDetailPU').css('display') != 'none')
            $('#machImageSelect').val(label);
        else if ($('#materialDetailPU').css('display') != 'none')
            $('#matImageSelect').val(label);
    });
    $('[data-toggle="tooltip"]').tooltip();
});

var filterTime = function filterTime(time) {


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