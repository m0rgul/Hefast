var request = require('request'),
    async = require('async'),
    fs = require('fs'),
    encode = require('./../modules/encoding.js');

exports.addMachine = function (req, res) {

    var factoryId = req.session.passport.user.factoryId;

    req.body.machine = JSON.parse(req.body.machine);
    var machine =
    {

        'name': encode.encodeString(req.body.machine.name),
        'description': encode.encodeString(req.body.machine.description),
        'materials': req.body.machine.materials,
        'recurringEvents': req.body.machine.recurringEvents
    };

    var tech =
    {
        'code': req.body.machine.technology.code,
        'display': req.body.machine.technology.display
    };

    machine.technology = tech;

    if (req.file) {

        /* Move file */

        var sourceFile = "./" + req.file.path.replace("\\", "/");

        var is = fs.createReadStream(sourceFile);
        var type;

        if (req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/jpeg')
            type = ".jpg";
        if (req.file.mimetype === 'image/png')
            type = ".png";

        var destination = "./public/img/" + factoryId;

        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }

        var file = factoryId + "_machine_" + encode.encodeString(req.body.machine.name.toLowerCase().split(' ').join('')) + type;
        var os = fs.createWriteStream(destination + "/" + file);

        is.pipe(os);
        is.on('end', function () {
            fs.unlinkSync(sourceFile);
        });
    }
    /* add machine data to CB */

    var contextElement = {
        "contextElements": [
            {
                "type": "Machine",
                "isPattern": "false",
                "id": factoryId + "_" + encode.encodeString(req.body.machine.name.toLowerCase().split(' ').join('')),
                "attributes": [
                    {
                        "name": "name",
                        "type": "string",
                        "value": machine.name
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "value": machine.description
                    },
                    {
                        "name": "technology",
                        "value": machine.technology
                    },
                    {
                        "name": "materials",
                        "value": machine.materials
                    },
                    {
                        "name": "factoryId",
                        "type": "string",
                        "value": factoryId
                    },
                    {
                        "name": "recurringEvents",
                        "value": machine.recurringEvents ? machine.recurringEvents : []
                    }
                ]
            }
        ],
        "updateAction": "APPEND"
    };

    request({
        url: urls.updateURL,
        method: "POST",
        json: true,
        body: contextElement,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
        var err = body.errorCode;

        if (!error && resp && !err) {
            //update factory if everything is ok
            var machines = req.body.machine.machineArray;
            var newMachineArray = [];
            if (machines && machines.length > 0) {
                machines.forEach(function (mach) {
                    var tech =
                    {
                        'code': mach.technology.code,
                        'display': mach.technology.display
                    };

                    var machine = {
                        'name': encode.encodeString(mach.name),
                        'description': encode.encodeString(mach.description),
                        'technology': tech,
                        'materials': mach.materials
                    };
                    newMachineArray.push(machine);
                });
            }

            var tech = {
                'code': machine.technology.code,
                'display': machine.technology.display
            };

            var newMach = {
                'name': machine.name,
                'description': machine.description,
                'technology': tech,
                'materials': machine.materials
            };
            newMachineArray.push(newMach);

            var matPush = {
                "contextElements": [
                    {
                        "type": "Factory",
                        "isPattern": "false",
                        "id": factoryId,
                        "attributes": [
                            {
                                "name": "machines",
                                "value": newMachineArray
                            }
                        ]
                    }
                ],
                "updateAction": "APPEND"
            };

            request({
                url: urls.updateURL,
                method: "POST",
                json: true,
                body: matPush,
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
                var err = body.errorCode;

                if (!error && resp && !err) {
                    return res.send('ok');
                } else {
                    return res.sendStatus(400)
                }
            });
        } else {
            return res.sendStatus(400)
        }
    });
};

exports.updateMachine = function (req, res) {

    var factoryId = req.session.passport.user.factoryId;

    var machine = JSON.parse(req.body.machine);
    var machines = machine.machineArray;

    if (req.file) {

        /* Move file */

        var sourceFile = "./" + req.file.path.replace("\\", "/");

        var is = fs.createReadStream(sourceFile);
        var type;
        if (req.file.mimetype === 'image/png')
            type = ".png";
        if (req.file.mimetype === 'image/jpg' || req.file.mimetype === 'image/jpeg')
            type = ".jpg";


        var destination = "./public/img/" + factoryId;

        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination);
        }

        var fileName = factoryId + "_machine_" + encode.encodeString(machine.name.toLowerCase().split(' ').join(''));
        var file = fileName + type;
        var os = fs.createWriteStream(destination + "/" + file);

        if (type == ".png" && fs.existsSync(destination + "/" + fileName + ".jpg")) {
            fs.unlinkSync(destination + "/" + fileName + ".jpg");
        }
        if (type == ".jpg" && fs.existsSync(destination + "/" + fileName + ".png")) {
            fs.unlinkSync(destination + "/" + fileName + ".png");
        }

        is.pipe(os);
        is.on('end', function () {
            fs.unlinkSync(sourceFile);
        });
    }

    /* add machine data to CB */

    var contextElement = {
        "contextElements": [
            {
                "type": "Machine",
                "isPattern": "false",
                "id": factoryId + "_" + encode.encodeString(machine.name.toLowerCase().split(' ').join('')),
                "attributes": [
                    {
                        "name": "name",
                        "type": "string",
                        "value": encode.encodeString(machine.name)
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "value": encode.encodeString(machine.description)
                    },
                    {
                        "name": "materials",
                        "value": machine.materials
                    },
                    {
                        "name": "recurringEvents",
                        "value": machine.recurringEvents ? machine.recurringEvents : []
                    },
                    {
                        "name": "technology",
                        "value": machine.technology
                    }
                ]
            }
        ],
        "updateAction": "UPDATE"
    };

    request({ //update machine
        url: urls.updateURL,
        method: "POST",
        json: true,
        body: contextElement,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
        var err = body.errorCode;
        if (!error && resp && !err) {

            var newMachineArray = [];

            machines.forEach(function (mach) {
                var machine = {
                    'name': encode.encodeString(mach.name),
                    'description': encode.encodeString(mach.description),
                    'materials': mach.materials,
                    'recurringEvents': mach.recurringEvents,
                    'technology': mach.technology
                };
                newMachineArray.push(machine);
            });

            //update factory
            var machPush = {
                "contextElements": [
                    {
                        "type": "Factory",
                        "isPattern": "false",
                        "id": factoryId,
                        "attributes": [
                            {
                                "name": "machines",
                                "value": newMachineArray
                            }
                        ]
                    }
                ],
                "updateAction": "APPEND"
            };
            request({
                url: urls.updateURL,
                method: "POST",
                json: true,
                body: machPush,
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
                var err = body.errorCode;

                if (!error && resp && !err) {
                    return res.send('ok');
                } else {
                    return res.sendStatus(400);
                }
            });
        } else {
            return res.sendStatus(400);
        }
    });
};

exports.deleteMachine = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var machine = req.body.machine.name;

    var fileName = factoryId + "_machine_" + encode.encodeString(machine.toLowerCase().split(' ').join(''));
    var path = "./public/img/" + factoryId + "/" + fileName;
    if (fs.existsSync(path + ".jpg"))
        fs.unlinkSync(path + ".jpg");
    if (fs.existsSync(path + ".png"))
        fs.unlinkSync(path + ".png");


    var newMachineArray = []; //to update factory page
    req.body.machineArray.forEach(function (mach) {

        var tech =
        {
            'code': mach.technology.code,
            'display': mach.technology.display
        };

        var newMachine = {
            'name': encode.encodeString(mach.name),
            'description': encode.encodeString(mach.description),
            'materials': mach.materials,
            'recurringEvents': mach.recurringEvents,
            'image': mach.image,
            'technology': tech
        };
        newMachineArray.push(newMachine);
    });


    var contextElement = {
        "contextElements": [
            {
                "type": "Machine",
                "isPattern": "false",
                "id": factoryId + "_" + encode.encodeString(machine.toLowerCase().split(' ').join(''))
            }
        ],
        "updateAction": "DELETE"
    };

    request({
        url: urls.updateURL,
        method: "POST",
        json: true,
        body: contextElement,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {
        var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
        var err = body.errorCode;
        if (!error && resp && !err) {
            //update factory
            var machinePush = {
                "contextElements": [
                    {
                        "type": "Factory",
                        "isPattern": "false",
                        "id": factoryId,
                        "attributes": [
                            {
                                "name": "machines",
                                "value": newMachineArray
                            }
                        ]
                    }
                ],
                "updateAction": "APPEND"
            };

            request({ //update factory
                url: urls.updateURL,
                method: "POST",
                json: true,
                body: machinePush,
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                var resp = body.contextResponses != undefined ? body.contextResponses[0] : null;
                var err = body.errorCode;

                if (!error && resp && !err) {
                    return res.send('ok');
                } else {
                    return res.sendStatus(400);
                }
            });
        } else {
            return res.sendStatus(400);
        }
    });
};

exports.getRecurringEvents = function (req, res) {
    var machineId = req.session.passport.user.factoryId + "_" + req.params.machineId.toLowerCase().split(' ').join('');

    var url = urls.v2_url + "entities/" + machineId + "/attrs/recurringEvents/value";

    request({
        url: url,
        method: "GET",
        json: true,
        header: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        proxy: false
    }, function (error, response, body) {

        if (response.statusCode == 200) {
            if (body && body.value.length > 0)
                return res.json(body.value);
            else
                return res.json([]);
        }
        else
            return res.sendStatus(response.statusCode);
    });

};