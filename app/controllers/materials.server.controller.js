var request = require('request'),
    async = require('async'),
    fs = require('fs');

var encode = require('./../modules/encoding.js');

exports.addMaterial = function (req, res) {

    var factoryId = req.session.passport.user.factoryId;
    var material =
    {
        'name': encode.encodeString(req.body.material.name),
        'description': encode.encodeString(req.body.material.description),
        'stock': req.body.material.stock
    };

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

        var file = factoryId + "_material_" + encode.encodeString(req.body.material.name.toLowerCase().split(' ').join('')) + type;
        var os = fs.createWriteStream(destination + "/" + file);

        is.pipe(os);
        is.on('end', function () {
            fs.unlinkSync(sourceFile);
        });
        /* add material data to CB */
    }


    var contextElement = {
        "contextElements": [
            {
                "type": "Material",
                "isPattern": "false",
                "id": factoryId + "_" + encode.encodeString(req.body.material.name.toLowerCase().split(' ').join('')),
                "attributes": [
                    {
                        "name": "name",
                        "type": "string",
                        "value": material.name
                    },
                    {
                        "name": "description",
                        "type": "string",
                        "value": material.description
                    },
                    {
                        "name": "stock",
                        "type": "float",
                        "value": material.stock
                    },
                    {
                        "name": "factoryId",
                        "type": "string",
                        "value": factoryId
                    },
                    {
                        "name": "reservedStock",
                        "type": "float",
                        "value": 0
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
            var materials = req.body.material.matArray;
            var mat2 = [];
            if (materials && materials.length > 0) {
                materials.forEach(function (mat) {
                    console.log(mat);
                    var newMat = {
                        'name': encode.encodeString(mat.name),
                        'description': encode.encodeString(mat.description),
                        'stock': mat.stock,
                        'reservedStock': mat.reservedStock
                    };
                    mat2.push(newMat);
                });
            }

            var newMat = {
                'name': material.name,
                'description': material.description ? material.description : "",
                'stock': material.stock,
                'reservedStock': 0
            };

            mat2.push(newMat);

            var matPush = {
                "contextElements": [
                    {
                        "type": "Factory",
                        "isPattern": "false",
                        "id": factoryId,
                        "attributes": [
                            {
                                "name": "materials",
                                "value": mat2
                            }
                        ]
                    }
                ],
                "updateAction": "UPDATE"
            };

            request({
                url: urls.v2_url + "entities/" + factoryId + "/attrs/materials",
                method: "PUT",
                json: true,
                body: {"value": mat2},
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                if (!error && resp && !err) {
                    return res.send('ok');
                } else {
                    return res.sendStatus(400);
                }
            });


        } else {
            return res.sendStatus(400)
        }
    });
};

exports.updateMaterial = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var material = //to update material itself
    {
        'name': req.body.material.name,
        'description': req.body.material.description,
        'stock': req.body.material.stock
    };


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
        var fileName = factoryId + "_material_" + encode.encodeString(material.name.toLowerCase().split(' ').join(''));
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


    var newMatArray = []; //to update factory page
    req.body.material.matArray.forEach(function (mat) {
        var newMat = {
            'name': encode.encodeString(mat.name),
            'description': encode.encodeString(mat.description),
            'stock': mat.stock,
            'reservedStock': mat.reservedStock
        };
        newMatArray.push(newMat);
    });

    var contextElement = {
        "contextElements": [
            {
                "type": "Material",
                "isPattern": "false",
                "id": factoryId + "_" + encode.encodeString(req.body.material.name.toLowerCase().split(' ').join('')),
                "attributes": [
                    {
                        "name": "description",
                        "type": "string",
                        "value": encode.encodeString(material.description)
                    },
                    {
                        "name": "stock",
                        "type": "float",
                        "value": material.stock
                    },
                    {
                        "name": "reservedStock",
                        "type": "float",
                        "value": 0
                    }
                ]
            }
        ],
        "updateAction": "UPDATE"
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
            request({
                url: urls.v2_url + "entities/" + factoryId + "/attrs/materials",
                method: "PUT",
                json: true,
                body: {"value": newMatArray},
                header: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                proxy: false
            }, function (error, response, body) {
                if (!error && response && !err) {
                    return res.send('ok');
                } else {
                    return res.sendStatus(400);
                }
            });

        } else {
            return res.sendStatus(400)
        }
    });
};

exports.deleteMaterial = function (req, res) {
    var factoryId = req.session.passport.user.factoryId;
    var material = req.body.material;

    var fileName = factoryId + "_material_" + encode.encodeString(material.name.toLowerCase().split(' ').join(''));
    var path = "./public/img/" + factoryId + "/" + fileName;

    if (fs.existsSync(path + ".jpg"))
        fs.unlinkSync(path + ".jpg");
    if (fs.existsSync(path + ".png"))
        fs.unlinkSync(path + ".png");


    var newMachineArray = req.body.newMachineArray;


    var newMatArray = []; //to update materials array in factory

    req.body.matArray.forEach(function (mat) {
        var newMat = {
            'name': encode.encodeString(mat.name),
            'description': encode.encodeString(mat.description),
            'stock': mat.stock,
            'reservedStock': mat.reservedStock,
            'image': mat.image
        };
        newMatArray.push(newMat);
    });

    async.auto({
        delMaterial: function (callback) {
            var contextElement = {
                "contextElements": [
                    {
                        "type": "Material",
                        "isPattern": "false",
                        "id": factoryId + "_" + encode.encodeString(req.body.material.name.toLowerCase().split(' ').join(''))
                    }
                ],
                "updateAction": "DELETE"
            };

            request({ //delete material
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
                    callback(null);
                } else {
                    return callback(err);
                }
            });
        },
        updateMachines: ['delMaterial', function (callback) {
            if (!newMachineArray || newMachineArray.length > 0) {
                callback(null);
            } else {
                async.forEach(newMachineArray, function (machine, cBack) {
                    var contextElement = {
                        "contextElements": [
                            {
                                "type": "Machine",
                                "isPattern": "false",
                                "id": factoryId + "_" + machine.name.toLowerCase().split(' ').join(''),
                                "attributes": [
                                    {
                                        "name": "materials",
                                        "value": machine.materials
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
                            cBack(null);
                        } else {
                            return cBack(err);
                        }
                    });
                });
                callback();
            }
        }],
        updateFactoryMaterials: ['delMaterial', function (callback) {
            var matPush = {
                "contextElements": [
                    {
                        "type": "Factory",
                        "isPattern": "false",
                        "id": factoryId,
                        "attributes": [
                            {
                                "name": "materials",
                                "value": newMatArray
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
                    callback(null);
                } else {
                    callback(err);
                }
            });
        }],
        updateFactoryMachines: ['delMaterial', function (callback) {
            if (!newMachineArray || newMachineArray.length == 0) {
                callback(null);
            } else {
                var machArray = [];
                newMachineArray.forEach(function (mach) {
                    var newMach =
                    {
                        'name': encode.encodeString(mach.name),
                        'description': encode.encodeString(mach.description),
                        'materials': mach.materials,
                        'technology': mach.technology,
                        'recurringEvents': mach.recurringEvents,
                        'image': mach.image
                    };

                    machArray.push(newMach);
                });

                var machPush = {
                    "contextElements": [
                        {
                            "type": "Factory",
                            "isPattern": "false",
                            "id": factoryId,
                            "attributes": [
                                {
                                    "name": "machines",
                                    "value": machArray
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
                        callback(null);
                    } else {
                        callback(err);
                    }
                });
            }
        }]
    }, function (err) {
        if (err)
            return res.sendStatus(err);
        else
            return res.sendStatus(200);
    });
};
