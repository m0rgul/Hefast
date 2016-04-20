var request = require('request'),
    async = require('async'),
    encode = require('./../modules/encoding.js'),
    fs = require('fs');

exports.render = function (req, res) {
    res.render('wirecloud.ejs');
};

exports.getGeneralStats = function (req, res) {
    var generalStats = {};
    async.auto({
        getFactories: function (callback) {
            var factories = 0;
            var url = urls.v2_url + "entities?type=Factory";
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
                    factories = body.length;
                    generalStats.factories = factories;
                    callback(null);
                }
                else
                    return callback(response.statusCode);
            });
        },
        getClients: function (callback) {
            var clients = 0;
            var url = urls.v2_url + "entities?type=Client";

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
                    clients = body.length;
                    generalStats.clients = clients;
                    callback(null);
                }
                else
                    return callback(response.statusCode);
            });
        },
        getOrders: function (callback) {
            var orders = 0;
            var url = urls.v2_url + "entities?type=Order";

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
                    orders = body.length;
                    generalStats.orders = orders;
                    callback(null);
                }
                else
                    return callback(response.statusCode);
            });
        },
        getMachines: function (callback) {
            var machines = 0;
            var url = urls.v2_url + "entities?type=Machine";

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
                    machines = body.length;
                    generalStats.machines = machines;
                    callback(null);
                }
                else
                    return callback(response.statusCode);
            });
        },
        getMaterials: function (callback) {
            var materials = 0;
            var url = urls.v2_url + "entities?type=Material";

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
                    materials = body.length;
                    generalStats.materials = materials;
                    callback(null);
                }
                else
                    return callback(response.statusCode);
            });
        }
    }, function (err) {
        if (err) {
            console.log(err);
            return res.json({});
        }
        else {
            res.json(generalStats);
        }
    });
};

exports.getAllFactories = function (req, res) {
    var url = urls.v2_url + "entities?type=Factory";
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
            var factories = body;
            var factoryList = [];
            factories.forEach(function (factory) {
                var fact = {};
                fact.id = factory.id;
                fact.description = encode.decodeString(factory.description.value);
                fact.name = encode.decodeString(factory.factoryName.value);
                fact.email = factory.factoryEmail.value;
                factoryList.push(fact);

                var path = "/img/" + fact.id + "/logo";

                if (fs.existsSync("./public" + path + ".jpg"))
                    fact.logo = path + ".jpg";
                else if (fs.existsSync("./public" + path + ".png"))
                    fact.logo = path + ".png";
                else
                    fact.logo = '/img/defaultLogo.jpg';

            });
            return res.json(factoryList);
        }
        else
            return res.json([]);
    });
};

exports.getAllClients = function (req, res) {
    var url = urls.v2_url + "entities?type=Client";

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
            return res.json(body);
        }
        else
            return res.json([]);
    });
};

exports.getAllOrders = function (req, res) {
    var url = urls.v2_url + "entities?type=Order";

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
            return res.json(body);
        }
        else
            return res.json([]);
    });
};

exports.getAllMachines = function (req, res) {
    var url = urls.v2_url + "entities?type=Machine";

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
            return res.json(body);
        }
        else
            return res.json([]);
    });
};

exports.getAllMaterials = function (req, res) {
    var url = urls.v2_url + "entities?type=Material";

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
            return res.json(body);
        }
        else
            return res.json([]);
    });
};


exports.getFactoryStats = function (req, res) {
    var factoryId = req.params.factoryId;
    var url = urls.v2_url + "entities/" + factoryId;
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
            var factory = {};
            factory.id = body.id;
            factory.description = encode.decodeString(body.description.value);
            factory.email = encode.decodeString(body.factoryEmail.value);
            factory.name = encode.decodeString(body.factoryName.value);
            factory.machines = body.machines.length;
            factory.materials = body.materials.length;

            var path = "/img/" + factoryId + "/logo";

            if (fs.existsSync("./public" + path + ".jpg"))
                factory.logo = path + ".jpg";
            else if (fs.existsSync("./public" + path + ".png"))
                factory.logo = path + ".png";
            else
                factory.logo = '/img/defaultLogo.jpg';

            return res.json(factory);
        } else {
            return res.json({});
        }
    });
};

exports.getFactoryOrders = function (req, res) {
    var factoryId = req.params.factoryId;
    var url = urls.v2_url + "entities?type=Order&q=factoryId==" + factoryId;
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
            var orders = body;
            var ordersList = [];
            if (orders && orders.length > 0) {
                orders.forEach(function (order) {
                    var newOrder = {
                        id: order.id,
                        client: order.client,
                        deadline: parseInt(order.deadline.value),
                        endDate: order.endDate.value ? parseInt(order.endDate.value) : 0,
                        startDate: order.startDate.value ? parseInt(order.startDate.value) : 0,
                        orderDate: parseInt(order.orderDate.value),
                        file: order.orderDetails.file,
                        originalFile: order.orderDetails.originalFileName,
                        comments: order.orderDetails.comments ? encode.decodeString(order.orderDetails.comments) : "",
                        status: order.status,
                        machine: order.machine ? encode.decodeString(order.machine.split('_')[1]) : "",
                        material: order.materialName ? encode.decodeString(order.materialName.split('_')[1]) : ""
                    };

                    ordersList.push(newOrder);
                });
                return res.json(ordersList);
            } else {
                return res.json([])
            }
        } else {
            return res.json([]);
        }
    });
};

exports.getFactoryClients = function (req, res) {
    var factoryId = req.params.factoryId;
    var url = urls.v2_url + "entities?type=Client&q=factoryId==" + factoryId;
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
            var clientsList = [];
            var clients = body;
            clients.forEach(function (client) {
                var newClient = {
                    id: client.id,
                    address: encode.decodeString(client.address.value),
                    dateJoined: parseInt(client.dateJoined.value),
                    email: client.email.value,
                    fullName: encode.decodeString(client.fullName.value),
                    phone: client.phoneNo.value
                };
                clientsList.push(newClient);
            });
            return res.json(clientsList);
        } else {
            return res.json({});
        }
    });
};

exports.getFactoryMachines = function (req, res) {
    var factoryId = req.params.factoryId;
    var url = urls.v2_url + "entities?type=Machine&q=factoryId==" + factoryId;
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
            var machines = body;
            var machineList = [];
            machines.forEach(function (machine) {
                var newMachine = {
                    id: machine.id,
                    name: encode.decodeString(machine.name.value),
                    description: encode.decodeString(machine.description.value),
                    technology: machine.technology.display,
                    materials: machine.materials
                };

                var fileName = factoryId + "_machine_" + encode.encodeString(newMachine.name.toLowerCase().split(' ').join(''));
                var path = "/img/" + factoryId + "/" + fileName;

                if (fs.existsSync("./public" + path + ".jpg"))
                    newMachine.image = path + ".jpg";
                else if (fs.existsSync("./public" + path + ".png"))
                    newMachine.image = path + ".png";
                else
                    newMachine.image = '/img/defaultMachine.jpg';

                machineList.push(newMachine);
            });
            return res.json(machineList);
        } else {
            return res.json({});
        }
    });
};

exports.getFactoryMaterials = function (req, res) {
    var factoryId = req.params.factoryId;
    var url = urls.v2_url + "entities?type=Material&q=factoryId==" + factoryId;
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
            var materials = body;
            var materialList = [];
            materials.forEach(function (material) {
                var newMaterial = {
                    id: material.id,
                    name: encode.decodeString(material.name.value),
                    description: encode.decodeString(material.description.value),
                    stock: parseFloat(material.stock.value)
                };

                var fileName = factoryId + "_material_" + encode.encodeString(newMaterial.name.toLowerCase().split(' ').join(''));
                var path = "/img/" + factoryId + "/" + fileName;

                if (fs.existsSync("./public" + path + ".jpg"))
                    newMaterial.image = path + ".jpg";
                else if (fs.existsSync("./public" + path + ".png"))
                    newMaterial.image = path + ".png";
                else
                    newMaterial.image = '/img/defaultMaterial.jpg';

                materialList.push(newMaterial);
            });
            return res.json(materialList);
        } else {
            return res.json({});
        }
    });
};